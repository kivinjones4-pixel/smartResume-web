package agent

import (
	"regexp"
	"sort"
	"strings"

	"sr-backend/internal/knowledge"
)

var keywordPattern = regexp.MustCompile(`[A-Za-z][A-Za-z0-9_.@/-]{1,}`)

var keywordStopWords = map[string]bool{
	"about":  true,
	"please": true,
	"the":    true,
	"this":   true,
}

// extractKeywords 从问题中提取关键词，转小写、去标点、过滤停用词和重复项，最多返回8个。
func extractKeywords(question string) []string {
	matches := keywordPattern.FindAllString(question, -1)
	seen := make(map[string]bool, len(matches))
	keywords := make([]string, 0, len(matches))
	for _, match := range matches {
		keyword := strings.ToLower(strings.Trim(match, "._-/"))
		if len(keyword) < 2 || keywordStopWords[keyword] || seen[keyword] {
			continue
		}
		seen[keyword] = true
		keywords = append(keywords, keyword)
		if len(keywords) == 8 {
			break
		}
	}
	return keywords
}

// mergeHybridResults 使用RRF融合向量和关键词检索结果，按综合分排序并截取TopK。
func mergeHybridResults(
	vectorResults []knowledge.SearchResult,
	keywordResults []knowledge.SearchResult,
	vectorMinSimilarity float64,
	finalTopK int,
	rrfK int,
) []knowledge.SearchResult {
	if finalTopK <= 0 {
		return []knowledge.SearchResult{}
	}
	if rrfK <= 0 {
		rrfK = 60
	}
	merged := make(map[string]knowledge.SearchResult, len(vectorResults)+len(keywordResults))
	for index, result := range vectorResults {
		if result.Similarity < vectorMinSimilarity {
			continue
		}
		result.RetrievalScore += reciprocalRank(index+1, rrfK)
		merged[result.ChunkID] = result
	}
	for index, result := range keywordResults {
		score := reciprocalRank(index+1, rrfK)
		if existing, ok := merged[result.ChunkID]; ok {
			existing.RetrievalScore += score
			existing.KeywordScore = result.KeywordScore
			merged[result.ChunkID] = existing
			continue
		}
		result.RetrievalScore = score
		merged[result.ChunkID] = result
	}
	results := make([]knowledge.SearchResult, 0, len(merged))
	for _, result := range merged {
		results = append(results, result)
	}
	sort.SliceStable(results, func(i, j int) bool {
		if results[i].RetrievalScore == results[j].RetrievalScore {
			if results[i].KeywordScore == results[j].KeywordScore {
				return results[i].Similarity > results[j].Similarity
			}
			return results[i].KeywordScore > results[j].KeywordScore
		}
		return results[i].RetrievalScore > results[j].RetrievalScore
	})
	if len(results) > finalTopK {
		results = results[:finalTopK]
	}
	return results
}

// reciprocalRank 计算倒数排名分数。
func reciprocalRank(rank, rrfK int) float64 {
	return 1 / float64(rrfK+rank)
}
