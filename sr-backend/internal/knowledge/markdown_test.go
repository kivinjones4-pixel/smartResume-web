package knowledge

import "testing"

// parseFrontMatter 解析文档的元数据和正文。
func TestParseFrontMatter(t *testing.T) {
	content := `---
title: 测试文档
category: faq
visibility: public
version: 2
---

# 问题

这是答案。
`
	metadata, body, err := parseFrontMatter(content)
	if err != nil {
		t.Fatalf("parseFrontMatter() error = %v", err)
	}
	if metadata["title"] != "测试文档" || metadata["version"] != "2" {
		t.Fatalf("unexpected metadata: %#v", metadata)
	}
	if body == "" {
		t.Fatal("parseFrontMatter() returned an empty body")
	}
}

func TestSplitDocument(t *testing.T) {
	document := Document{Body: "# 第一节\n\n第一段。\n\n## 第二节\n\n第二段。"}
	chunks := SplitDocument(document)
	if len(chunks) != 2 {
		t.Fatalf("SplitDocument() returned %d chunks, expected 2", len(chunks))
	}
	if chunks[0].Heading != "第一节" || chunks[1].Heading != "第二节" {
		t.Fatalf("unexpected headings: %#v", chunks)
	}
	for index, chunk := range chunks {
		if chunk.Index != index || chunk.Hash == "" || chunk.Content == "" {
			t.Fatalf("invalid chunk %d: %#v", index, chunk)
		}
	}
}
