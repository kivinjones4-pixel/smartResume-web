package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/service"
	"sr-backend/pkg/response"
)

const UserIDKey = "auth_user_id"

func RequireAuth(auth *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, http.StatusUnauthorized, "AUTH_REQUIRED", "请先登录")
			c.Abort()
			return
		}
		claims, err := auth.ParseAccessToken(strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")))
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "ACCESS_TOKEN_EXPIRED", "登录状态已过期")
			c.Abort()
			return
		}
		c.Set(UserIDKey, claims.Subject)
		c.Next()
	}
}

func OptionalAuth(auth *service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			if claims, err := auth.ParseAccessToken(strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))); err == nil {
				c.Set(UserIDKey, claims.Subject)
			}
		}
		c.Next()
	}
}

func CORS(allowedOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == allowedOrigin {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Device-ID, X-Visitor-Token")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Vary", "Origin")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
