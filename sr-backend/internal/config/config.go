package config

import (
	"fmt"
	"os"
	"os/user"
	"strings"
)

type Config struct {
	ServerAddr  string
	FrontendURL string
	Database    DatabaseConfig
	Auth        AuthConfig
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
	}
}

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

func dsnValue(value string) string {
	value = strings.ReplaceAll(value, `\`, `\\`)
	return strings.ReplaceAll(value, `'`, `\'`)
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func currentUsername() string {
	current, err := user.Current()
	if err != nil {
		return ""
	}
	return current.Username
}
