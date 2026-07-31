package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"sr-backend/internal/model"
)

var ErrEducationNotFound = errors.New("教育经历不存在")

type EducationService struct {
	db *gorm.DB
}

type EducationInput struct {
	ResumeID     string
	SchoolName   string
	Degree       *string
	FieldOfStudy *string
	Location     *string
	StartDate    time.Time
	EndDate      *time.Time
	IsCurrent    bool
	GPA          *string
	Description  *string
}

func NewEducationService(db *gorm.DB) *EducationService {
	return &EducationService{db: db}
}

func (s *EducationService) List(userID, resumeID string) ([]model.Education, error) {
	educations := make([]model.Education, 0)
	err := s.db.Table("educations AS e").
		Select("e.*").
		Joins("JOIN resume_education_rel AS rel ON rel.education_id = e.id AND rel.user_id = e.user_id").
		Where("e.user_id = ? AND rel.resume_id = ?", userID, resumeID).
		Order("rel.sort_order ASC, e.start_date DESC, e.created_at DESC").
		Scan(&educations).Error
	return educations, err
}

func (s *EducationService) ListAll(userID string) ([]model.Education, error) {
	educations := make([]model.Education, 0)
	err := s.db.Where("user_id = ?", userID).
		Order("start_date DESC NULLS LAST, created_at DESC").
		Find(&educations).Error
	return educations, err
}

func (s *EducationService) Create(userID string, input EducationInput) (*model.Education, error) {
	education := model.Education{
		UserID: userID, SchoolName: strings.TrimSpace(input.SchoolName),
		Degree: cleanOptional(input.Degree), FieldOfStudy: cleanOptional(input.FieldOfStudy),
		Location: cleanOptional(input.Location), StartDate: &input.StartDate,
		EndDate: input.EndDate, IsCurrent: input.IsCurrent, GPA: cleanOptional(input.GPA),
		Description: cleanOptional(input.Description),
	}
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		if err := tx.Create(&education).Error; err != nil {
			return err
		}
		var nextOrder int
		if err := tx.Raw(
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_education_rel WHERE resume_id = ?",
			input.ResumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			"INSERT INTO resume_education_rel (resume_id, education_id, user_id, sort_order) VALUES (?, ?, ?, ?)",
			input.ResumeID, education.ID, userID, nextOrder,
		).Error
	})
	return &education, err
}

func (s *EducationService) Update(userID, educationID string, input EducationInput) (*model.Education, error) {
	var education model.Education
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		result := tx.Model(&model.Education{}).
			Where("id = ? AND user_id = ?", educationID, userID).
			Updates(map[string]any{
				"school_name":    strings.TrimSpace(input.SchoolName),
				"degree":         cleanOptional(input.Degree),
				"field_of_study": cleanOptional(input.FieldOfStudy),
				"location":       cleanOptional(input.Location),
				"start_date":     input.StartDate,
				"end_date":       input.EndDate,
				"is_current":     input.IsCurrent,
				"gpa":            cleanOptional(input.GPA),
				"description":    cleanOptional(input.Description),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrEducationNotFound
		}
		return tx.Where("id = ? AND user_id = ?", educationID, userID).First(&education).Error
	})
	return &education, err
}

func (s *EducationService) Attach(userID, resumeID, educationID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&model.Education{}).
			Where("id = ? AND user_id = ?", educationID, userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrEducationNotFound
		}
		var nextOrder int
		if err := tx.Raw(
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_education_rel WHERE resume_id = ?",
			resumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			`INSERT INTO resume_education_rel (resume_id, education_id, user_id, sort_order)
			 VALUES (?, ?, ?, ?) ON CONFLICT (resume_id, education_id) DO NOTHING`,
			resumeID, educationID, userID, nextOrder,
		).Error
	})
}

func (s *EducationService) Detach(userID, resumeID, educationID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		return tx.Exec(
			"DELETE FROM resume_education_rel WHERE resume_id = ? AND education_id = ? AND user_id = ?",
			resumeID, educationID, userID,
		).Error
	})
}

func (s *EducationService) Delete(userID, educationID string) error {
	result := s.db.Where("id = ? AND user_id = ?", educationID, userID).Delete(&model.Education{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrEducationNotFound
	}
	return nil
}

func ensureResume(tx *gorm.DB, userID, resumeID string) error {
	var count int64
	if err := tx.Model(&model.Resume{}).
		Where("id = ? AND user_id = ?", resumeID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ErrResumeNotFound
	}
	return nil
}

func cleanOptional(value *string) *string {
	if value == nil {
		return nil
	}
	cleaned := strings.TrimSpace(*value)
	if cleaned == "" {
		return nil
	}
	return &cleaned
}
