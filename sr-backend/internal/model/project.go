package model

import "time"

type ProjectExperience struct {
	ID            string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID        string     `gorm:"column:user_id;type:uuid;not null" json:"-"`
	ProjectName   string     `gorm:"column:project_name;size:200;not null" json:"project_name"`
	RoleName      string     `gorm:"column:role_name;size:150;not null" json:"role_name"`
	ProjectURL    *string    `gorm:"column:project_url" json:"project_url"`
	RepositoryURL *string    `gorm:"column:repository_url" json:"repository_url"`
	StartDate     *time.Time `gorm:"column:start_date;type:date;not null" json:"start_date"`
	EndDate       *time.Time `gorm:"column:end_date;type:date" json:"end_date"`
	IsCurrent     bool       `gorm:"column:is_current;not null" json:"is_current"`
	Achievements  StringList `gorm:"column:achievements;type:jsonb;not null" json:"achievements"`
	Description   *string    `gorm:"column:description" json:"description"`
	CreatedAt     time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (ProjectExperience) TableName() string {
	return "project_experiences"
}
