package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

type StringList []string

func (list *StringList) Scan(value any) error {
	if value == nil {
		*list = StringList{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		if text, textOK := value.(string); textOK {
			bytes = []byte(text)
		} else {
			return fmt.Errorf("scan string list from %T", value)
		}
	}
	return json.Unmarshal(bytes, list)
}

func (list StringList) Value() (driver.Value, error) {
	if list == nil {
		list = StringList{}
	}
	return json.Marshal(list)
}

type Internship struct {
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

func (Internship) TableName() string {
	return "internship_experiences"
}
