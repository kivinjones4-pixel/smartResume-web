package agent

import (
	"strings"
	"testing"

	"sr-backend/internal/knowledge"
)

// expandPlatformReferences 展开平台引用词为SmartResume
func TestExpandPlatformReferences(t *testing.T) {
	expanded := expandPlatformReferences("这个网站是谁开发的？")
	if expanded == "这个网站是谁开发的？" {
		t.Fatal("expected platform reference to be expanded")
	}
	if expected := "SmartResume"; !strings.Contains(expanded, expected) {
		t.Fatalf("expanded query %q does not contain %q", expanded, expected)
	}
}

// extractKeywords 提取关键词并转小写。
func TestExtractKeywords(t *testing.T) {
	keywords := extractKeywords("请介绍一下 Kivin 和 SmartResume，邮箱是 kivinjones4@gmail.com")
	expected := []string{"kivin", "smartresume", "kivinjones4@gmail.com"}
	if len(keywords) != len(expected) {
		t.Fatalf("extractKeywords() = %#v, expected %#v", keywords, expected)
	}
	for index := range expected {
		if keywords[index] != expected[index] {
			t.Fatalf("extractKeywords() = %#v, expected %#v", keywords, expected)
		}
	}
}

// 测试合并混合结果时包含低于向量阈值的精确关键词匹配项。
func TestMergeHybridResultsIncludesExactKeywordBelowVectorThreshold(t *testing.T) {
	vectorResults := []knowledge.SearchResult{
		{ChunkID: "platform", SourcePath: "product/platform-intro.md", Similarity: 0.8},
		{ChunkID: "developer", SourcePath: "developer/profile.md", Similarity: 0.2},
	}
	keywordResults := []knowledge.SearchResult{
		{ChunkID: "developer", SourcePath: "developer/profile.md", KeywordScore: 1},
	}
	results := mergeHybridResults(vectorResults, keywordResults, 0.45, 5, 60)
	if len(results) != 2 {
		t.Fatalf("mergeHybridResults() returned %d results, expected 2", len(results))
	}
	if results[0].ChunkID != "developer" {
		t.Fatalf("top result = %q, expected developer", results[0].ChunkID)
	}
}

// TestMergeHybridResultsBoostsResultsFoundByBothRetrievers 测试双检索命中提升排序优先级
func TestMergeHybridResultsBoostsResultsFoundByBothRetrievers(t *testing.T) {
	vectorResults := []knowledge.SearchResult{
		{ChunkID: "faq", Similarity: 0.9},
		{ChunkID: "developer", Similarity: 0.8},
	}
	keywordResults := []knowledge.SearchResult{
		{ChunkID: "developer", KeywordScore: 1},
	}
	results := mergeHybridResults(vectorResults, keywordResults, 0.45, 5, 60)
	if results[0].ChunkID != "developer" {
		t.Fatalf("top result = %q, expected developer", results[0].ChunkID)
	}
}

// 测试显式名称不被替换
func TestExpandPlatformReferencesLeavesExplicitNameUnchanged(t *testing.T) {
	question := "SmartResume 是谁开发的？"
	if actual := expandPlatformReferences(question); actual != question {
		t.Fatalf("expandPlatformReferences() = %q, expected %q", actual, question)
	}
}
