package handler

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/config"
	"sr-backend/internal/middleware"
	"sr-backend/internal/model"
	"sr-backend/internal/service"
)

const refreshCookieName = "sr_refresh_token"

type AuthHandler struct {
	auth *service.AuthService
	cfg  config.AuthConfig
}

type registerRequest struct {
	Email    string `json:"email" binding:"required,max=320"`
	Password string `json:"password" binding:"required,min=8,max=72"`
	Username string `json:"username" binding:"required,min=2,max=50"`
}

type loginRequest struct {
	Identifier string `json:"identifier" binding:"required,max=320"`
	Password   string `json:"password" binding:"required,max=72"`
}

func NewAuthHandler(auth *service.AuthService, cfg config.AuthConfig) *AuthHandler {
	return &AuthHandler{auth: auth, cfg: cfg}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请填写有效的邮箱、用户名和至少 8 位密码"})
		return
	}
	address, err := mail.ParseAddress(strings.TrimSpace(req.Email))
	if err != nil || address.Address != strings.TrimSpace(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "邮箱格式不正确"})
		return
	}
	req.Email = address.Address
	user, err := h.auth.Register(req.Email, req.Password, req.Username)
	if err != nil {
		h.authError(c, err)
		return
	}
	pair, err := h.auth.IssueTokenPair(user, c.Request.UserAgent(), c.ClientIP())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "注册成功，但登录凭证生成失败"})
		return
	}
	h.setRefreshCookie(c, pair.RefreshToken, pair.RefreshExpiresAt)
	c.JSON(http.StatusCreated, tokenResponse(user, pair))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请输入邮箱或手机号和密码"})
		return
	}
	user, err := h.auth.Login(req.Identifier, req.Password)
	if err != nil {
		h.authError(c, err)
		return
	}
	pair, err := h.auth.IssueTokenPair(user, c.Request.UserAgent(), c.ClientIP())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "登录失败，请稍后重试"})
		return
	}
	h.setRefreshCookie(c, pair.RefreshToken, pair.RefreshExpiresAt)
	c.JSON(http.StatusOK, tokenResponse(user, pair))
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	rawToken, err := c.Cookie(refreshCookieName)
	if err != nil || rawToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "登录状态已过期"})
		return
	}
	user, pair, err := h.auth.RotateRefreshToken(rawToken, c.Request.UserAgent(), c.ClientIP())
	if err != nil {
		h.clearRefreshCookie(c)
		c.JSON(http.StatusUnauthorized, gin.H{"message": "登录状态已过期，请重新登录"})
		return
	}
	h.setRefreshCookie(c, pair.RefreshToken, pair.RefreshExpiresAt)
	c.JSON(http.StatusOK, tokenResponse(user, pair))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	rawToken, _ := c.Cookie(refreshCookieName)
	h.auth.RevokeRefreshToken(rawToken)
	h.clearRefreshCookie(c)
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	user, err := h.auth.UserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "用户不存在或已停用"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": publicUser(user)})
}

func (h *AuthHandler) authError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
	case errors.Is(err, service.ErrAccountDisabled):
		c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
	case errors.Is(err, service.ErrEmailExists), errors.Is(err, service.ErrUsernameExists):
		c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "服务暂时不可用"})
	}
}

func (h *AuthHandler) setRefreshCookie(c *gin.Context, token string, expiresAt time.Time) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		refreshCookieName,
		token,
		int(time.Until(expiresAt).Seconds()),
		"/api/v1/auth",
		"",
		h.cfg.CookieSecure,
		true,
	)
}

func (h *AuthHandler) clearRefreshCookie(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(refreshCookieName, "", -1, "/api/v1/auth", "", h.cfg.CookieSecure, true)
}

func tokenResponse(user *model.User, pair *service.TokenPair) gin.H {
	return gin.H{
		"access_token": pair.AccessToken,
		"token_type":   "Bearer",
		"expires_in":   pair.AccessExpiresIn,
		"user":         publicUser(user),
	}
}

func publicUser(user *model.User) gin.H {
	return gin.H{
		"id":       user.ID,
		"email":    user.Email,
		"username": user.Username,
		"phone":    user.Phone,
	}
}
