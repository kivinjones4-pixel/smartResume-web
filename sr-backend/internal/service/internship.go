package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"sr-backend/internal/model"
)

var ErrInternshipNotFound = errors.New("实习经历不存在")

type InternshipService struct {
	db *gorm.DB
}

type InternshipInput struct {
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

func NewInternshipService(db *gorm.DB) *InternshipService {
	return &InternshipService{db: db}
}

func (s *InternshipService) List(userID, resumeID string) ([]model.Internship, error) {
	items := make([]model.Internship, 0)
	err := s.db.Table("internship_experiences AS i").
		Select("i.*").
		Joins("JOIN resume_internship_rel AS rel ON rel.internship_id = i.id AND rel.user_id = i.user_id").
		Where("i.user_id = ? AND rel.resume_id = ?", userID, resumeID).
		Order("rel.sort_order ASC, i.start_date DESC, i.created_at DESC").
		Scan(&items).Error
	return items, err
}

func (s *InternshipService) ListAll(userID string) ([]model.Internship, error) {
	items := make([]model.Internship, 0)
	err := s.db.Where("user_id = ?", userID).
		Order("start_date DESC NULLS LAST, created_at DESC").
		Find(&items).Error
	return items, err
}

func (s *InternshipService) Create(userID string, input InternshipInput) (*model.Internship, error) {
	item := model.Internship{
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
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_internship_rel WHERE resume_id = ?",
			input.ResumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			"INSERT INTO resume_internship_rel (resume_id, internship_id, user_id, sort_order) VALUES (?, ?, ?, ?)",
			input.ResumeID, item.ID, userID, nextOrder,
		).Error
	})
	return &item, err
}

func (s *InternshipService) Update(userID, internshipID string, input InternshipInput) (*model.Internship, error) {
	var item model.Internship
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		result := tx.Model(&model.Internship{}).
			Where("id = ? AND user_id = ?", internshipID, userID).
			Updates(map[string]any{
				"company_name":   strings.TrimSpace(input.CompanyName),
				"position_title": strings.TrimSpace(input.PositionTitle),
				"department":     cleanOptional(input.Department),
				"location":       cleanOptional(input.Location),
				"start_date":     input.StartDate,
				"end_date":       input.EndDate,
				"is_current":     input.IsCurrent,
				"achievements":   model.StringList(cleanStringList(input.Achievements)),
				"description":    cleanOptional(input.Description),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrInternshipNotFound
		}
		return tx.Where("id = ? AND user_id = ?", internshipID, userID).First(&item).Error
	})
	return &item, err
}

func (s *InternshipService) Attach(userID, resumeID, internshipID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&model.Internship{}).
			Where("id = ? AND user_id = ?", internshipID, userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrInternshipNotFound
		}
		var nextOrder int
		if err := tx.Raw(
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_internship_rel WHERE resume_id = ?",
			resumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			`INSERT INTO resume_internship_rel (resume_id, internship_id, user_id, sort_order)
			 VALUES (?, ?, ?, ?) ON CONFLICT (resume_id, internship_id) DO NOTHING`,
			resumeID, internshipID, userID, nextOrder,
		).Error
	})
}

func (s *InternshipService) Detach(userID, resumeID, internshipID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		return tx.Exec(
			"DELETE FROM resume_internship_rel WHERE resume_id = ? AND internship_id = ? AND user_id = ?",
			resumeID, internshipID, userID,
		).Error
	})
}

func (s *InternshipService) Delete(userID, internshipID string) error {
	result := s.db.Where("id = ? AND user_id = ?", internshipID, userID).Delete(&model.Internship{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrInternshipNotFound
	}
	return nil
}

func cleanStringList(values []string) model.StringList {
	result := make(model.StringList, 0, len(values))
	for _, value := range values {
		if cleaned := strings.TrimSpace(value); cleaned != "" {
			result = append(result, cleaned)
		}
	}
	return result
}
