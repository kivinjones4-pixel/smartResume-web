package knowledge

import "strings"

const maxChunkRunes = 1200

// SplitDocument 将文档按Markdown章节及长度拆分为块。
func SplitDocument(document Document) []Chunk {
	sections := markdownSections(document.Body)
	chunks := make([]Chunk, 0, len(sections))
	for _, section := range sections {
		for _, content := range splitLongText(section.content, maxChunkRunes) {
			content = strings.TrimSpace(content)
			if content == "" {
				continue
			}
			chunks = append(chunks, Chunk{
				Index:   len(chunks),
				Heading: section.heading,
				Content: content,
				Hash:    hashText(content),
			})
		}
	}
	return chunks
}

type markdownSection struct {
	heading string
	content string
}

// markdownSections 按标题拆分Markdown为章节切片
func markdownSections(body string) []markdownSection {
	lines := strings.Split(strings.ReplaceAll(body, "\r\n", "\n"), "\n")
	sections := make([]markdownSection, 0)
	var heading string
	var content strings.Builder
	flush := func() {
		text := strings.TrimSpace(content.String())
		if text != "" {
			sections = append(sections, markdownSection{heading: heading, content: text})
		}
		content.Reset()
	}
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "#") {
			candidate := strings.TrimSpace(strings.TrimLeft(trimmed, "#"))
			if candidate != "" {
				flush()
				heading = candidate
				content.WriteString(candidate)
				content.WriteByte('\n')
				continue
			}
		}
		content.WriteString(line)
		content.WriteByte('\n')
	}
	flush()
	return sections
}

// splitLongText 按limit切分长文本，优先按段落合并，超限则强制截断。
func splitLongText(text string, limit int) []string {
	if len([]rune(text)) <= limit {
		return []string{text}
	}
	paragraphs := strings.Split(text, "\n\n")
	parts := make([]string, 0)
	var current strings.Builder
	flush := func() {
		if value := strings.TrimSpace(current.String()); value != "" {
			parts = append(parts, value)
		}
		current.Reset()
	}
	for _, paragraph := range paragraphs {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph == "" {
			continue
		}
		if len([]rune(paragraph)) > limit {
			flush()
			runes := []rune(paragraph)
			for len(runes) > 0 {
				end := min(limit, len(runes))
				parts = append(parts, strings.TrimSpace(string(runes[:end])))
				runes = runes[end:]
			}
			continue
		}
		separatorLength := 0
		if current.Len() > 0 {
			separatorLength = 2
		}
		if len([]rune(current.String()))+separatorLength+len([]rune(paragraph)) > limit {
			flush()
		}
		if current.Len() > 0 {
			current.WriteString("\n\n")
		}
		current.WriteString(paragraph)
	}
	flush()
	return parts
}
