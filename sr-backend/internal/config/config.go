package config

import (
	"fmt"
	"os"
	"os/user"
	"strconv"
	"strings"
)

type Config struct {
	ServerAddr  string
	FrontendURL string
	Database    DatabaseConfig
	Auth        AuthConfig
	AI          AIConfig
	Assistant   AssistantConfig
}

type AIProviderConfig struct {
	Provider string
	APIKey   string
	BaseURL  string
	Model    string
}

type AIConfig struct {
	Chat                 AIProviderConfig
	Embedding            AIProviderConfig
	EmbeddingDimensions  int
	TimeoutSeconds       int
	PolishTimeoutSeconds int
}

type AssistantConfig struct {
	Name                   string
	KnowledgePath          string
	RAGEnabled             bool
	RAGVectorTopK          int
	RAGKeywordTopK         int
	RAGFinalTopK           int
	RAGVectorMinSimilarity float64
	RAGRRFK                int
}

type AuthConfig struct {
	AccessSecret  string
	RefreshSecret string
	AccessMinutes int
	RefreshDays   int
	CookieSecure  bool
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	TimeZone string
}

func Load() Config {
	return Config{
		ServerAddr:  envOrDefault("SERVER_ADDR", ":8080"),
		FrontendURL: envOrDefault("FRONTEND_URL", "http://localhost:5173"),
		Auth: AuthConfig{
			AccessSecret:  envOrDefault("JWT_ACCESS_SECRET", "local-dev-access-secret-change-me"),
			RefreshSecret: envOrDefault("JWT_REFRESH_SECRET", "local-dev-refresh-secret-change-me"),
			AccessMinutes: 15,
			RefreshDays:   7,
			CookieSecure:  envOrDefault("COOKIE_SECURE", "false") == "true",
		},
		Database: DatabaseConfig{
			Host:     envOrDefault("DB_HOST", "/tmp"),
			Port:     envOrDefault("DB_PORT", "5432"),
			User:     envOrDefault("DB_USER", currentUsername()),
			Password: os.Getenv("DB_PASSWORD"),
			Name:     envOrDefault("DB_NAME", "LocalAIResumeDB"),
			SSLMode:  envOrDefault("DB_SSLMODE", "disable"),
			TimeZone: envOrDefault("DB_TIMEZONE", "Asia/Shanghai"),
		},
		AI: AIConfig{
			Chat: AIProviderConfig{
				Provider: envOrDefault("AI_CHAT_PROVIDER", "openai-compatible"),
				APIKey:   os.Getenv("AI_CHAT_API_KEY"),
				BaseURL:  strings.TrimSpace(os.Getenv("AI_CHAT_BASE_URL")),
				Model:    strings.TrimSpace(os.Getenv("AI_CHAT_MODEL")),
			},
			Embedding: AIProviderConfig{
				Provider: envOrDefault("AI_EMBEDDING_PROVIDER", "openai-compatible"),
				APIKey:   os.Getenv("AI_EMBEDDING_API_KEY"),
				BaseURL:  strings.TrimSpace(os.Getenv("AI_EMBEDDING_BASE_URL")),
				Model:    strings.TrimSpace(os.Getenv("AI_EMBEDDING_MODEL")),
			},
			EmbeddingDimensions:  envInt("AI_EMBEDDING_DIMENSIONS", 1536),
			TimeoutSeconds:       envInt("AI_TIMEOUT_SECONDS", 60),
			PolishTimeoutSeconds: envInt("AI_POLISH_TIMEOUT_SECONDS", 180),
		},
		Assistant: AssistantConfig{
			Name:                   envOrDefault("ASSISTANT_NAME", "KK"),
			KnowledgePath:          envOrDefault("KNOWLEDGE_PATH", "../knowledge"),
			RAGEnabled:             envBool("RAG_ENABLED", true),
			RAGVectorTopK:          envInt("RAG_VECTOR_TOP_K", 20),
			RAGKeywordTopK:         envInt("RAG_KEYWORD_TOP_K", 20),
			RAGFinalTopK:           envInt("RAG_FINAL_TOP_K", envInt("RAG_TOP_K", 5)),
			RAGVectorMinSimilarity: envFloat("RAG_VECTOR_MIN_SIMILARITY", envFloat("RAG_MIN_SIMILARITY", 0.45)),
			RAGRRFK:                envInt("RAG_RRF_K", 60),
		},
	}
}

// ValidateEmbedding 校验嵌入配置必填项及参数有效性。
func (c AIConfig) ValidateEmbedding() error {
	missing := make([]string, 0, 3)
	if strings.TrimSpace(c.Embedding.APIKey) == "" {
		missing = append(missing, "AI_EMBEDDING_API_KEY")
	}
	if strings.TrimSpace(c.Embedding.BaseURL) == "" {
		missing = append(missing, "AI_EMBEDDING_BASE_URL")
	}
	if strings.TrimSpace(c.Embedding.Model) == "" {
		missing = append(missing, "AI_EMBEDDING_MODEL")
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing embedding configuration: %s", strings.Join(missing, ", "))
	}
	if c.EmbeddingDimensions <= 0 {
		return fmt.Errorf("AI_EMBEDDING_DIMENSIONS must be greater than zero")
	}
	if c.TimeoutSeconds <= 0 {
		return fmt.Errorf("AI_TIMEOUT_SECONDS must be greater than zero")
	}
	if c.PolishTimeoutSeconds <= 0 {
		return fmt.Errorf("AI_POLISH_TIMEOUT_SECONDS must be greater than zero")
	}
	return nil
}

// ValidateChat 校验聊天配置及超时时间。
func (c AIConfig) ValidateChat() error {
	missing := make([]string, 0, 3)
	if strings.TrimSpace(c.Chat.APIKey) == "" {
		missing = append(missing, "AI_CHAT_API_KEY")
	}
	if strings.TrimSpace(c.Chat.BaseURL) == "" {
		missing = append(missing, "AI_CHAT_BASE_URL")
	}
	if strings.TrimSpace(c.Chat.Model) == "" {
		missing = append(missing, "AI_CHAT_MODEL")
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing chat configuration: %s", strings.Join(missing, ", "))
	}
	if c.TimeoutSeconds <= 0 {
		return fmt.Errorf("AI_TIMEOUT_SECONDS must be greater than zero")
	}
	return nil
}

// DSN 返回数据库连接串。
func (c DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password='%s' dbname=%s sslmode=%s TimeZone=%s",
		c.Host,
		c.Port,
		c.User,
		dsnValue(c.Password),
		c.Name,
		c.SSLMode,
		c.TimeZone,
	)
}

// dsnValue 转义DSN值中的反斜杠和单引号。
func dsnValue(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	return strings.ReplaceAll(value, `'`, `\'`)
}

// envOrDefault 获取环境变量，为空则返回默认值。
func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// envInt 从环境变量获取整数值，空或无效则返回默认值。
func envInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

// envFloat 从环境变量获取浮点数，失败则返回fallback。
func envFloat(key string, fallback float64) float64 {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return fallback
	}
	return parsed
}

// envBool 从环境变量获取布尔值，空或无效则返回fallback。
func envBool(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func currentUsername() string {
	current, err := user.Current()
	if err != nil {
		return ""
	}
	return current.Username
}
