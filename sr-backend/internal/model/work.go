package model

import "time"

type WorkExperience struct {
	ID            string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID        string     `gorm:"column:user_id;type:uuid;not null" json:"-"`
	CompanyName   string     `gorm:"column:company_name;size:200;not null" json:"company_name"`
	PositionTitle string     `gorm:"column:position_title;size:150;not null" json:"position_title"`
	Department    *string    `gorm:"column:department;size:150" json:"department"`
	Location      *string    `gorm:"column:location;size:150" json:"location"`
	StartDate     *time.Time `gorm:"column:start_date;type:date;not null" json:"start_date"`
	EndDate       *time.Time `gorm:"column:end_date;type:date" json:"end_date"`
	IsCurrent     bool       `gorm:"column:is_current;not null" json:"is_current"`
	Achievements  StringList `gorm:"column:achievements;type:jsonb;not null" json:"achievements"`
	Description   *string    `gorm:"column:description" json:"description"`
	CreatedAt     time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at" json:"updated_at"`
}

func (WorkExperience) TableName() string {
	return "work_experiences"
}
