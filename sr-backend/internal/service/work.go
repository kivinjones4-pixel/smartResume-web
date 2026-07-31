package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"sr-backend/internal/model"
)

var ErrWorkNotFound = errors.New("工作经历不存在")

type WorkService struct {
	db *gorm.DB
}

type WorkInput struct {
	ResumeID      string
	CompanyName   string
	PositionTitle string
	Department    *string
	Location      *string
	StartDate     time.Time
	EndDate       *time.Time
	IsCurrent     bool
	Achievements  []string
	Description   *string
}

func NewWorkService(db *gorm.DB) *WorkService {
	return &WorkService{db: db}
}

func (s *WorkService) List(userID, resumeID string) ([]model.WorkExperience, error) {
	items := make([]model.WorkExperience, 0)
	err := s.db.Table("work_experiences AS w").
		Select("w.*").
		Joins("JOIN resume_work_rel AS rel ON rel.work_experience_id = w.id AND rel.user_id = w.user_id").
		Where("w.user_id = ? AND rel.resume_id = ?", userID, resumeID).
		Order("rel.sort_order ASC, w.start_date DESC, w.created_at DESC").
		Scan(&items).Error
	return items, err
}

func (s *WorkService) ListAll(userID string) ([]model.WorkExperience, error) {
	items := make([]model.WorkExperience, 0)
	err := s.db.Where("user_id = ?", userID).
		Order("start_date DESC NULLS LAST, created_at DESC").
		Find(&items).Error
	return items, err
}

func (s *WorkService) Create(userID string, input WorkInput) (*model.WorkExperience, error) {
	item := model.WorkExperience{
		UserID: userID, CompanyName: strings.TrimSpace(input.CompanyName),
		PositionTitle: strings.TrimSpace(input.PositionTitle),
		Department:    cleanOptional(input.Department), Location: cleanOptional(input.Location),
		StartDate: &input.StartDate, EndDate: input.EndDate, IsCurrent: input.IsCurrent,
		Achievements: cleanStringList(input.Achievements),
		Description:  cleanOptional(input.Description),
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
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_work_rel WHERE resume_id = ?",
			input.ResumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			"INSERT INTO resume_work_rel (resume_id, work_experience_id, user_id, sort_order) VALUES (?, ?, ?, ?)",
			input.ResumeID, item.ID, userID, nextOrder,
		).Error
	})
	return &item, err
}

func (s *WorkService) Update(userID, workID string, input WorkInput) (*model.WorkExperience, error) {
	var item model.WorkExperience
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		result := tx.Model(&model.WorkExperience{}).
			Where("id = ? AND user_id = ?", workID, userID).
			Updates(map[string]any{
				"company_name": strings.TrimSpace(input.CompanyName), "position_title": strings.TrimSpace(input.PositionTitle),
				"department": cleanOptional(input.Department), "location": cleanOptional(input.Location),
				"start_date": input.StartDate, "end_date": input.EndDate, "is_current": input.IsCurrent,
				"achievements": model.StringList(cleanStringList(input.Achievements)),
				"description":  cleanOptional(input.Description),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrWorkNotFound
		}
		return tx.Where("id = ? AND user_id = ?", workID, userID).First(&item).Error
	})
	return &item, err
}

func (s *WorkService) Attach(userID, resumeID, workID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&model.WorkExperience{}).Where("id = ? AND user_id = ?", workID, userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrWorkNotFound
		}
		var nextOrder int
		if err := tx.Raw("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_work_rel WHERE resume_id = ?", resumeID).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			`INSERT INTO resume_work_rel (resume_id, work_experience_id, user_id, sort_order)
			 VALUES (?, ?, ?, ?) ON CONFLICT (resume_id, work_experience_id) DO NOTHING`,
			resumeID, workID, userID, nextOrder,
		).Error
	})
}

func (s *WorkService) Detach(userID, resumeID, workID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		return tx.Exec(
			"DELETE FROM resume_work_rel WHERE resume_id = ? AND work_experience_id = ? AND user_id = ?",
			resumeID, workID, userID,
		).Error
	})
}

func (s *WorkService) Delete(userID, workID string) error {
	result := s.db.Where("id = ? AND user_id = ?", workID, userID).Delete(&model.WorkExperience{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWorkNotFound
	}
	return nil
}
