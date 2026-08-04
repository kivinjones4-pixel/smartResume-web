package model

import "time"

type UserAIAgentSetting struct {
	UserID         string    `gorm:"column:user_id;type:uuid;primaryKey" json:"-"`
	LanguageStyle  string    `gorm:"column:language_style;size:30;not null" json:"language_style"`
	WelcomeMessage string    `gorm:"column:welcome_message;size:500;not null" json:"welcome_message"`
	AdditionalInfo string    `gorm:"column:additional_info;not null" json:"additional_info"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

type ResumeAccessSetting struct {
	ResumeID      string     `gorm:"column:resume_id;type:uuid;primaryKey" json:"resume_id"`
	UserID        string     `gorm:"column:user_id;type:uuid;not null" json:"-"`
	Visibility    string     `gorm:"column:visibility;size:20;not null" json:"visibility"`
	VisitorCode   *string    `gorm:"column:visitor_code;size:6" json:"visitor_code"`
	AIEnabled     bool       `gorm:"column:ai_enabled;not null" json:"ai_enabled"`
	VisibleFields JSONConfig `gorm:"column:visible_fields;type:jsonb;not null" json:"visible_fields"`
	CreatedAt     time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

type ResumeAccessRow struct {
	ResumeID       string     `json:"resume_id"`
	Title          string     `json:"title"`
	TargetPosition *string    `json:"target_position"`
	TemplateKey    string     `json:"template_key"`
	Visibility     string     `json:"visibility"`
	VisitorCode    *string    `json:"visitor_code"`
	AIEnabled      bool       `json:"ai_enabled"`
	VisibleFields  JSONConfig `json:"visible_fields"`
}
