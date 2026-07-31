package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"sr-backend/internal/model"
)

var ErrProjectNotFound = errors.New("项目经历不存在")

type ProjectService struct {
	db *gorm.DB
}

type ProjectInput struct {
	ResumeID      string
	ProjectName   string
	RoleName      string
	ProjectURL    *string
	RepositoryURL *string
	StartDate     time.Time
	EndDate       *time.Time
	IsCurrent     bool
	Achievements  []string
	Description   *string
}

func NewProjectService(db *gorm.DB) *ProjectService {
	return &ProjectService{db: db}
}

func (s *ProjectService) List(userID, resumeID string) ([]model.ProjectExperience, error) {
	items := make([]model.ProjectExperience, 0)
	err := s.db.Table("project_experiences AS p").
		Select("p.*").
		Joins("JOIN resume_project_rel AS rel ON rel.project_experience_id = p.id AND rel.user_id = p.user_id").
		Where("p.user_id = ? AND rel.resume_id = ?", userID, resumeID).
		Order("rel.sort_order ASC, p.start_date DESC, p.created_at DESC").
		Scan(&items).Error
	return items, err
}

func (s *ProjectService) ListAll(userID string) ([]model.ProjectExperience, error) {
	items := make([]model.ProjectExperience, 0)
	err := s.db.Where("user_id = ?", userID).
		Order("start_date DESC NULLS LAST, created_at DESC").
		Find(&items).Error
	return items, err
}

func (s *ProjectService) Create(userID string, input ProjectInput) (*model.ProjectExperience, error) {
	item := model.ProjectExperience{
		UserID: userID, ProjectName: strings.TrimSpace(input.ProjectName),
		RoleName: strings.TrimSpace(input.RoleName), ProjectURL: cleanOptional(input.ProjectURL),
		RepositoryURL: cleanOptional(input.RepositoryURL), StartDate: &input.StartDate,
		EndDate: input.EndDate, IsCurrent: input.IsCurrent,
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
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_project_rel WHERE resume_id = ?",
			input.ResumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			"INSERT INTO resume_project_rel (resume_id, project_experience_id, user_id, sort_order) VALUES (?, ?, ?, ?)",
			input.ResumeID, item.ID, userID, nextOrder,
		).Error
	})
	return &item, err
}

func (s *ProjectService) Update(userID, projectID string, input ProjectInput) (*model.ProjectExperience, error) {
	var item model.ProjectExperience
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, input.ResumeID); err != nil {
			return err
		}
		result := tx.Model(&model.ProjectExperience{}).
			Where("id = ? AND user_id = ?", projectID, userID).
			Updates(map[string]any{
				"project_name":   strings.TrimSpace(input.ProjectName),
				"role_name":      strings.TrimSpace(input.RoleName),
				"project_url":    cleanOptional(input.ProjectURL),
				"repository_url": cleanOptional(input.RepositoryURL),
				"start_date":     input.StartDate, "end_date": input.EndDate,
				"is_current":   input.IsCurrent,
				"achievements": model.StringList(cleanStringList(input.Achievements)),
				"description":  cleanOptional(input.Description),
			})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return ErrProjectNotFound
		}
		return tx.Where("id = ? AND user_id = ?", projectID, userID).First(&item).Error
	})
	return &item, err
}

func (s *ProjectService) Attach(userID, resumeID, projectID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&model.ProjectExperience{}).
			Where("id = ? AND user_id = ?", projectID, userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return ErrProjectNotFound
		}
		var nextOrder int
		if err := tx.Raw(
			"SELECT COALESCE(MAX(sort_order), -1) + 1 FROM resume_project_rel WHERE resume_id = ?",
			resumeID,
		).Scan(&nextOrder).Error; err != nil {
			return err
		}
		return tx.Exec(
			`INSERT INTO resume_project_rel (resume_id, project_experience_id, user_id, sort_order)
			 VALUES (?, ?, ?, ?) ON CONFLICT (resume_id, project_experience_id) DO NOTHING`,
			resumeID, projectID, userID, nextOrder,
		).Error
	})
}

func (s *ProjectService) Detach(userID, resumeID, projectID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := ensureResume(tx, userID, resumeID); err != nil {
			return err
		}
		return tx.Exec(
			"DELETE FROM resume_project_rel WHERE resume_id = ? AND project_experience_id = ? AND user_id = ?",
			resumeID, projectID, userID,
		).Error
	})
}

func (s *ProjectService) Delete(userID, projectID string) error {
	result := s.db.Where("id = ? AND user_id = ?", projectID, userID).Delete(&model.ProjectExperience{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrProjectNotFound
	}
	return nil
}
