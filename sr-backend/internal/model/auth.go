package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

type JSONConfig json.RawMessage

func (value JSONConfig) Value() (driver.Value, error) {
	if len(value) == 0 {
		return "{}", nil
	}
	return string(value), nil
}

func (value *JSONConfig) Scan(source any) error {
	switch data := source.(type) {
	case []byte:
		*value = append((*value)[:0], data...)
	case string:
		*value = append((*value)[:0], data...)
	case nil:
		*value = JSONConfig("{}")
	default:
		return fmt.Errorf("unsupported JSON config type %T", source)
	}
	return nil
}

func (value JSONConfig) MarshalJSON() ([]byte, error) {
	if len(value) == 0 {
		return []byte("{}"), nil
	}
	return value, nil
}

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
	ID                string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID            string     `gorm:"column:user_id;type:uuid;not null;unique" json:"user_id"`
	FullName          string     `gorm:"column:full_name;size:100;not null" json:"full_name"`
	AvatarURL         *string    `gorm:"column:avatar_url" json:"avatar_url"`
	Headline          *string    `gorm:"column:headline;size:200" json:"headline"`
	Gender            *string    `gorm:"column:gender;size:20" json:"gender"`
	BirthDate         *time.Time `gorm:"column:birth_date;type:date" json:"birth_date"`
	Location          *string    `gorm:"column:location;size:150" json:"location"`
	ContactEmail      *string    `gorm:"column:contact_email;size:320" json:"contact_email"`
	ContactPhone      *string    `gorm:"column:contact_phone;size:32" json:"contact_phone"`
	WebsiteURL        *string    `gorm:"column:website_url" json:"website_url"`
	GithubURL         *string    `gorm:"column:github_url" json:"github_url"`
	LinkedinURL       *string    `gorm:"column:linkedin_url" json:"linkedin_url"`
	Summary           *string    `gorm:"column:summary" json:"summary"`
	YearsOfExperience *float64   `gorm:"column:years_of_experience" json:"years_of_experience"`
	CreatedAt         time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt         time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

type Resume struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         string     `gorm:"column:user_id;type:uuid;not null" json:"-"`
	Title          string     `gorm:"column:title;size:150;not null" json:"title"`
	TargetPosition *string    `gorm:"column:target_position;size:150" json:"target_position"`
	TargetCompany  *string    `gorm:"column:target_company;size:200" json:"target_company"`
	TemplateKey    string     `gorm:"column:template_key;size:80;not null" json:"template_key"`
	LanguageCode   string     `gorm:"column:language_code;size:10;not null" json:"language_code"`
	ThemeConfig    JSONConfig `gorm:"column:theme_config;type:jsonb;not null" json:"theme_config"`
	Status         string     `gorm:"column:status;size:20;not null" json:"status"`
	IsDefault      bool       `gorm:"column:is_default;not null" json:"is_default"`
	CreatedAt      time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

type Education struct {
	ID           string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       string     `gorm:"column:user_id;type:uuid;not null" json:"-"`
	SchoolName   string     `gorm:"column:school_name;size:200;not null" json:"school_name"`
	Degree       *string    `gorm:"column:degree;size:100" json:"degree"`
	FieldOfStudy *string    `gorm:"column:field_of_study;size:150" json:"field_of_study"`
	Location     *string    `gorm:"column:location;size:150" json:"location"`
	StartDate    *time.Time `gorm:"column:start_date;type:date;not null" json:"start_date"`
	EndDate      *time.Time `gorm:"column:end_date;type:date" json:"end_date"`
	IsCurrent    bool       `gorm:"column:is_current;not null" json:"is_current"`
	GPA          *string    `gorm:"column:gpa;size:32" json:"gpa"`
	Description  *string    `gorm:"column:description" json:"description"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (Education) TableName() string {
	return "educations"
}

func (Resume) TableName() string {
	return "resumes"
}

func (UserProfile) TableName() string {
	return "user_profiles"
}
