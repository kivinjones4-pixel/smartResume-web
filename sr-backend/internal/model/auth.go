package model

import "time"

type User struct {
	ID              string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email           string     `gorm:"size:320;not null" json:"email"`
	Username        string     `gorm:"size:50;not null" json:"username"`
	PasswordHash    string     `gorm:"column:password_hash;size:255;not null" json:"-"`
	Phone           *string    `gorm:"size:32" json:"phone,omitempty"`
	Status          string     `gorm:"size:20;not null" json:"status"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `json:"-"`
}

func (User) TableName() string {
	return "users"
}

type RefreshToken struct {
	ID           string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       string     `gorm:"column:user_id;type:uuid;not null"`
	TokenHash    string     `gorm:"column:token_hash;size:128;not null;unique"`
	ExpiresAt    time.Time  `gorm:"column:expires_at;not null"`
	RevokedAt    *time.Time `gorm:"column:revoked_at"`
	ReplacedByID *string    `gorm:"column:replaced_by_id;type:uuid"`
	UserAgent    string     `gorm:"column:user_agent"`
	IPAddress    string     `gorm:"column:ip_address"`
	CreatedAt    time.Time  `gorm:"column:created_at"`
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

type UserProfile struct {
	ID       string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID   string `gorm:"column:user_id;type:uuid;not null;unique"`
	FullName string `gorm:"column:full_name;size:100;not null"`
}

func (UserProfile) TableName() string {
	return "user_profiles"
}
