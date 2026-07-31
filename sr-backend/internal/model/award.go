package model

import "time"

type Award struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         string    `gorm:"column:user_id;type:uuid;not null" json:"-"`
	AwardName      string    `gorm:"column:award_name;size:200;not null" json:"award_name"`
	Issuer         string    `gorm:"column:issuer;size:200;not null" json:"issuer"`
	CertificateURL *string   `gorm:"column:certificate_url" json:"certificate_url"`
	Description    *string   `gorm:"column:description" json:"description"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Award) TableName() string {
	return "awards"
}
