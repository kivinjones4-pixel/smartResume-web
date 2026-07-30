package service

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"sr-backend/internal/model"
)

var ErrResumeNotFound = errors.New("简历不存在")

type ResumeService struct {
	db *gorm.DB
}

type BasicProfileInput struct {
	ResumeID        string
	TargetPosition  string
	FullName        string
	Gender          string
	Headline        *string
	BirthDate       *string
	Location        *string
	ContactEmail    *string
	ContactPhone    *string
	WebsiteURL      *string
	GithubURL       *string
	LinkedinURL     *string
	Summary         *string
	YearsExperience *float64
}

func NewResumeService(db *gorm.DB) *ResumeService {
	return &ResumeService{db: db}
}

func (s *ResumeService) List(userID string) ([]model.Resume, error) {
	var resumes []model.Resume
	err := s.db.Where("user_id = ?", userID).
		Order("is_default DESC, updated_at DESC").
		Find(&resumes).Error
	return resumes, err
}

func (s *ResumeService) Create(userID, title string) (*model.Resume, error) {
	title = strings.TrimSpace(title)
	if title == "" {
		title = "未命名简历"
	}
	var resume model.Resume
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&model.Resume{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
			return err
		}
		resume = model.Resume{
			UserID:       userID,
			Title:        title,
			TemplateKey:  "default",
			LanguageCode: "zh-CN",
			Status:       "draft",
			IsDefault:    count == 0,
		}
		return tx.Create(&resume).Error
	})
	return &resume, err
}

func (s *ResumeService) Rename(userID, resumeID, title string) (*model.Resume, error) {
	title = strings.TrimSpace(title)
	var resume model.Resume
	result := s.db.Model(&model.Resume{}).
		Where("id = ? AND user_id = ?", resumeID, userID).
		Update("title", title)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, ErrResumeNotFound
	}
	if err := s.db.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		return nil, err
	}
	return &resume, nil
}

func (s *ResumeService) Delete(userID, resumeID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var resume model.Resume
		if err := tx.Where("id = ? AND user_id = ?", resumeID, userID).
			First(&resume).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrResumeNotFound
			}
			return err
		}
		if err := tx.Delete(&resume).Error; err != nil {
			return err
		}
		if resume.IsDefault {
			var replacement model.Resume
			err := tx.Where("user_id = ?", userID).
				Order("updated_at DESC").
				First(&replacement).Error
			if err == nil {
				return tx.Model(&replacement).Update("is_default", true).Error
			}
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		}
		return nil
	})
}

func (s *ResumeService) BasicProfile(userID string) (*model.UserProfile, error) {
	var profile model.UserProfile
	err := s.db.Where("user_id = ?", userID).First(&profile).Error
	return &profile, err
}

func (s *ResumeService) SaveBasicProfile(userID string, input BasicProfileInput) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var resume model.Resume
		if err := tx.Where("id = ? AND user_id = ?", input.ResumeID, userID).
			First(&resume).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrResumeNotFound
			}
			return err
		}

		profileUpdates := map[string]any{
			"full_name":           strings.TrimSpace(input.FullName),
			"gender":              input.Gender,
			"headline":            input.Headline,
			"location":            input.Location,
			"contact_email":       input.ContactEmail,
			"contact_phone":       input.ContactPhone,
			"website_url":         input.WebsiteURL,
			"github_url":          input.GithubURL,
			"linkedin_url":        input.LinkedinURL,
			"summary":             input.Summary,
			"years_of_experience": input.YearsExperience,
		}
		if input.BirthDate != nil && *input.BirthDate != "" {
			profileUpdates["birth_date"] = *input.BirthDate
		} else {
			profileUpdates["birth_date"] = nil
		}
		if err := tx.Model(&model.UserProfile{}).
			Where("user_id = ?", userID).
			Updates(profileUpdates).Error; err != nil {
			return err
		}
		return tx.Model(&model.Resume{}).
			Where("id = ? AND user_id = ?", input.ResumeID, userID).
			Update("target_position", strings.TrimSpace(input.TargetPosition)).Error
	})
}
