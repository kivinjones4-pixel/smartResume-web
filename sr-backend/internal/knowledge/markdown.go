package knowledge

import (
	"bufio"
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// LoadDocuments 从指定目录加载.md文档，忽略README.md及子目录。
func LoadDocuments(root string) ([]Document, error) {
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve knowledge path: %w", err)
	}
	info, err := os.Stat(absRoot)
	if err != nil {
		return nil, fmt.Errorf("open knowledge path %q: %w", absRoot, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("knowledge path %q is not a directory", absRoot)
	}

	documents := make([]Document, 0)
	err = filepath.WalkDir(absRoot, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() || strings.ToLower(filepath.Ext(path)) != ".md" {
			return nil
		}
		relative, err := filepath.Rel(absRoot, path)
		if err != nil {
			return err
		}
		if filepath.ToSlash(relative) == "README.md" {
			return nil
		}
		document, err := parseMarkdownFile(path, filepath.ToSlash(relative))
		if err != nil {
			return err
		}
		documents = append(documents, document)
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("scan knowledge documents: %w", err)
	}
	return documents, nil
}

// parseMarkdownFile 解析Markdown文件为文档结构体。
func parseMarkdownFile(path, sourcePath string) (Document, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return Document{}, fmt.Errorf("read knowledge document %q: %w", sourcePath, err)
	}
	metadata, body, err := parseFrontMatter(string(content))
	if err != nil {
		return Document{}, fmt.Errorf("parse knowledge document %q: %w", sourcePath, err)
	}

	version := 1
	if raw := metadata["version"]; raw != "" {
		version, err = strconv.Atoi(raw)
		if err != nil || version <= 0 {
			return Document{}, fmt.Errorf("version must be a positive integer")
		}
	}
	document := Document{
		Title:      metadata["title"],
		SourcePath: sourcePath,
		SourceURL:  metadata["source_url"],
		Category:   metadata["category"],
		Visibility: defaultString(metadata["visibility"], "public"),
		Status:     defaultString(metadata["status"], "active"),
		Version:    version,
		Body:       strings.TrimSpace(body),
	}
	if document.Title == "" {
		return Document{}, fmt.Errorf("front matter title is required")
	}
	if document.Category == "" {
		return Document{}, fmt.Errorf("front matter category is required")
	}
	if document.Body == "" {
		return Document{}, fmt.Errorf("document body is empty")
	}
	document.Hash = hashText(string(content))
	return document, nil
}

// parseFrontMatter 解析YAML前置元数据，返回键值对、正文及错误。
func parseFrontMatter(content string) (map[string]string, string, error) {
	scanner := bufio.NewScanner(strings.NewReader(content))
	scanner.Buffer(make([]byte, 4096), 1024*1024)
	if !scanner.Scan() || strings.TrimSpace(scanner.Text()) != "---" {
		return nil, "", fmt.Errorf("YAML front matter must start with ---")
	}

	metadata := make(map[string]string)
	foundEnd := false
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "---" {
			foundEnd = true
			break
		}
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, ":")
		if !ok {
			return nil, "", fmt.Errorf("invalid front matter line %q", line)
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key == "" {
			return nil, "", fmt.Errorf("front matter key cannot be empty")
		}
		metadata[key] = value
	}
	if err := scanner.Err(); err != nil {
		return nil, "", err
	}
	if !foundEnd {
		return nil, "", fmt.Errorf("YAML front matter is not closed")
	}

	var body strings.Builder
	for scanner.Scan() {
		body.WriteString(scanner.Text())
		body.WriteByte('\n')
	}
	if err := scanner.Err(); err != nil {
		return nil, "", err
	}
	return metadata, body.String(), nil
}

func hashText(value string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(value)))
}

func defaultString(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}
