package service

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"sr-backend/internal/model"
)

var ErrAwardNotFound = errors.New("获奖记录不存在")

type AwardService struct {
	db *gorm.DB
}

type AwardInput struct {
	ResumeID       string
	AwardName      string
	Issuer         string
	CertificateURL *string
	Description    *string
}

func NewAwardService(db *gorm.DB) *AwardService {
	return &AwardService{db: db}
}

func (s *AwardService) List(userID, resumeID string) ([]model.Award, error) {
	items := make([]model.Award, 0)
	err := s.db.Table("awards AS a").
		Select("a.*").
		Joins("JOIN resume_award_rel AS rel ON rel.award_id = a.id AND rel.user_id = a.user_id").
		Where("a.user_id = ? AND rel.resume_id = ?", userID, resumeID).
		Order("rel.sort_order ASC, a.created_at DESC").
		Scan(&items).Error
	return items, err
}

func (s *AwardService) ListAll(userID string) ([]model.Award, error) {
	items := make([]model.Award, 0)
	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

func (s *AwardService) Create(userID string, input AwardInput) (*model.Award, error) {
	item := model.Award{
		UserID: userID, AwardName: strings.TrimSpace(input.AwardName),
		Issuer: strings.TrimSpace(input.Issuer), CertificateURL: cleanOptional(input.CertificateURL),
		Description: cleanOptional(input.Description),
	}
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		if err := tx.Create(&item).Error; err != nil {
			return err
		}
		var nextOrder int
		if err := tx.Raw(
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_award_rel WHERE resume_id = ?",
			input.ResumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			"INSERT INTO resume_award_rel (resume_id, award_id, user_id, sort_order) VALUES (?, ?, ?, ?)",
			input.ResumeID, item.ID, userID, nextOrder,
		).Error
	})
	return &item, err
}

func (s *AwardService) Update(userID, awardID string, input AwardInput) (*model.Award, error) {
	var item model.Award
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		result := tx.Model(&model.Award{}).
			Where("id = ? AND user_id = ?", awardID, userID).
			Updates(map[string]any{
				"award_name":      strings.TrimSpace(input.AwardName),
				"issuer":          strings.TrimSpace(input.Issuer),
				"certificate_url": cleanOptional(input.CertificateURL),
				"description":     cleanOptional(input.Description),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrAwardNotFound
		}
		return tx.Where("id = ? AND user_id = ?", awardID, userID).First(&item).Error
	})
	return &item, err
}

func (s *AwardService) Attach(userID, resumeID, awardID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&model.Award{}).
			Where("id = ? AND user_id = ?", awardID, userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrAwardNotFound
		}
		var nextOrder int
		if err := tx.Raw(
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_award_rel WHERE resume_id = ?",
			resumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			`INSERT INTO resume_award_rel (resume_id, award_id, user_id, sort_order)
			 VALUES (?, ?, ?, ?) ON CONFLICT (resume_id, award_id) DO NOTHING`,
			resumeID, awardID, userID, nextOrder,
		).Error
	})
}

func (s *AwardService) Detach(userID, resumeID, awardID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		return tx.Exec(
			"DELETE FROM resume_award_rel WHERE resume_id = ? AND award_id = ? AND user_id = ?",
			resumeID, awardID, userID,
		).Error
	})
}

func (s *AwardService) Delete(userID, awardID string) error {
	result := s.db.Where("id = ? AND user_id = ?", awardID, userID).Delete(&model.Award{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrAwardNotFound
	}
	return nil
}
