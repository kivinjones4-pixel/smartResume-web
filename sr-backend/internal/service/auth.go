package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"sr-backend/internal/config"
	"sr-backend/internal/model"
)

var (
	ErrInvalidCredentials = errors.New("邮箱/手机号或密码错误")
	ErrAccountDisabled    = errors.New("账号已停用")
	ErrEmailExists        = errors.New("邮箱已被注册")
	ErrUsernameExists     = errors.New("用户名已被使用")
	ErrInvalidToken       = errors.New("登录凭证无效或已过期")
)

type AuthService struct {
	db  *gorm.DB
	cfg config.AuthConfig
}

type TokenClaims struct {
	TokenType string `json:"token_type"`
	Username  string `json:"username"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken      string
	RefreshToken     string
	AccessExpiresIn  int64
	RefreshExpiresAt time.Time
	RefreshID        string
}

func NewAuthService(db *gorm.DB, cfg config.AuthConfig) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

func (s *AuthService) Register(email, password, username string) (*model.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	username = strings.TrimSpace(username)

	var count int64
	if err := s.db.Model(&model.User{}).
		Where("lower(email) = ? AND deleted_at IS NULL", email).
		Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrEmailExists
	}
	if err := s.db.Model(&model.User{}).
		Where("lower(username) = ? AND deleted_at IS NULL", strings.ToLower(username)).
		Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrUsernameExists
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &model.User{
		Email:        email,
		Username:     username,
		PasswordHash: string(passwordHash),
		Status:       "active",
	}
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return tx.Create(&model.UserProfile{
			UserID:   user.ID,
			FullName: username,
		}).Error
	})
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) Login(identifier, password string) (*model.User, error) {
	identifier = strings.TrimSpace(identifier)
	var user model.User
	err := s.db.Where(
		"(lower(email) = ? OR phone = ?) AND deleted_at IS NULL",
		strings.ToLower(identifier),
		identifier,
	).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if user.Status != "active" {
		return nil, ErrAccountDisabled
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return nil, ErrInvalidCredentials
	}
	now := time.Now()
	_ = s.db.Model(&user).Update("last_login_at", now).Error
	user.LastLoginAt = &now
	return &user, nil
}

func (s *AuthService) IssueTokenPair(user *model.User, userAgent, ip string) (*TokenPair, error) {
	now := time.Now()
	accessExpires := now.Add(time.Duration(s.cfg.AccessMinutes) * time.Minute)
	refreshExpires := now.Add(time.Duration(s.cfg.RefreshDays) * 24 * time.Hour)
	refreshID := newTokenID()

	access, err := s.sign(user, "access", newTokenID(), accessExpires, s.cfg.AccessSecret)
	if err != nil {
		return nil, err
	}
	refresh, err := s.sign(user, "refresh", refreshID, refreshExpires, s.cfg.RefreshSecret)
	if err != nil {
		return nil, err
	}
	record := model.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash(refresh),
		ExpiresAt: refreshExpires,
		UserAgent: userAgent,
		IPAddress: ip,
	}
	if err := s.db.Create(&record).Error; err != nil {
		return nil, err
	}
	return &TokenPair{
		AccessToken:      access,
		RefreshToken:     refresh,
		AccessExpiresIn:  int64(time.Until(accessExpires).Seconds()),
		RefreshExpiresAt: refreshExpires,
		RefreshID:        record.ID,
	}, nil
}

func (s *AuthService) RotateRefreshToken(rawToken, userAgent, ip string) (*model.User, *TokenPair, error) {
	claims, err := s.parse(rawToken, "refresh", s.cfg.RefreshSecret)
	if err != nil {
		return nil, nil, ErrInvalidToken
	}

	var stored model.RefreshToken
	err = s.db.Where(
		"token_hash = ? AND revoked_at IS NULL AND expires_at > ?",
		tokenHash(rawToken),
		time.Now(),
	).First(&stored).Error
	if err != nil {
		return nil, nil, ErrInvalidToken
	}
	if stored.UserID != claims.Subject {
		return nil, nil, ErrInvalidToken
	}

	var user model.User
	if err := s.db.Where("id = ? AND status = 'active' AND deleted_at IS NULL", claims.Subject).
		First(&user).Error; err != nil {
		return nil, nil, ErrInvalidToken
	}

	pair, err := s.IssueTokenPair(&user, userAgent, ip)
	if err != nil {
		return nil, nil, err
	}
	now := time.Now()
	if err := s.db.Model(&stored).Updates(map[string]any{
		"revoked_at":     now,
		"replaced_by_id": pair.RefreshID,
	}).Error; err != nil {
		return nil, nil, err
	}
	return &user, pair, nil
}

func (s *AuthService) RevokeRefreshToken(rawToken string) {
	if rawToken == "" {
		return
	}
	now := time.Now()
	_ = s.db.Model(&model.RefreshToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash(rawToken)).
		Update("revoked_at", now).Error
}

func (s *AuthService) ParseAccessToken(rawToken string) (*TokenClaims, error) {
	return s.parse(rawToken, "access", s.cfg.AccessSecret)
}

func (s *AuthService) UserByID(id string) (*model.User, error) {
	var user model.User
	if err := s.db.Where("id = ? AND status = 'active' AND deleted_at IS NULL", id).
		First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) sign(
	user *model.User,
	tokenType string,
	id string,
	expiresAt time.Time,
	secret string,
) (string, error) {
	claims := TokenClaims{
		TokenType: tokenType,
		Username:  user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        id,
			Subject:   user.ID,
			Issuer:    "smart-resume",
			Audience:  jwt.ClaimStrings{"smart-resume-web"},
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString([]byte(secret))
}

func (s *AuthService) parse(rawToken, expectedType, secret string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(
		rawToken,
		&TokenClaims{},
		func(token *jwt.Token) (any, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, ErrInvalidToken
			}
			return []byte(secret), nil
		},
		jwt.WithIssuer("smart-resume"),
		jwt.WithAudience("smart-resume-web"),
		jwt.WithExpirationRequired(),
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	)
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || claims.TokenType != expectedType || claims.Subject == "" {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

func tokenHash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func newTokenID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
