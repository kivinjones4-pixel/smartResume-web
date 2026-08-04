package service

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"sr-backend/internal/model"
)

var allowedVisibleFields = map[string]bool{
	"full_name": true, "birth_date": true, "contact_phone": true,
	"contact_email": true, "location": true, "github_url": true, "website_url": true,
}

type AccessSettingService struct{ db *gorm.DB }

type ResumeAccessUpdate struct {
	Visibility       *string
	AIEnabled        *bool
	VisibleFields    []string
	HasVisibleFields bool
}

func NewAccessSettingService(db *gorm.DB) *AccessSettingService { return &AccessSettingService{db: db} }

func (s *AccessSettingService) Get(userID string) (*model.UserAIAgentSetting, []model.ResumeAccessRow, error) {
	agent := model.UserAIAgentSetting{UserID: userID, LanguageStyle: "professional"}
	if err := s.db.Where("user_id = ?", userID).FirstOrCreate(&agent).Error; err != nil {
		return nil, nil, err
	}
	var resumes []model.Resume
	if err := s.db.Where("user_id = ?", userID).Order("updated_at DESC").Find(&resumes).Error; err != nil {
		return nil, nil, err
	}
	rows := make([]model.ResumeAccessRow, 0, len(resumes))
	for _, resume := range resumes {
		setting, err := s.ensureResumeSetting(userID, resume.ID)
		if err != nil {
			return nil, nil, err
		}
		rows = append(rows, model.ResumeAccessRow{ResumeID: resume.ID, Title: resume.Title, TargetPosition: resume.TargetPosition, TemplateKey: resume.TemplateKey, Visibility: setting.Visibility, VisitorCode: setting.VisitorCode, AIEnabled: setting.AIEnabled, VisibleFields: setting.VisibleFields})
	}
	return &agent, rows, nil
}

func (s *AccessSettingService) SaveAgent(userID, languageStyle, welcomeMessage, additionalInfo string) (*model.UserAIAgentSetting, error) {
	agent := model.UserAIAgentSetting{UserID: userID, LanguageStyle: languageStyle, WelcomeMessage: welcomeMessage, AdditionalInfo: additionalInfo}
	err := s.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "user_id"}}, DoUpdates: clause.AssignmentColumns([]string{"language_style", "welcome_message", "additional_info", "updated_at"})}).Create(&agent).Error
	return &agent, err
}

func (s *AccessSettingService) UpdateResume(userID, resumeID string, input ResumeAccessUpdate) (*model.ResumeAccessSetting, error) {
	var owned int64
	if err := s.db.Model(&model.Resume{}).Where("id = ? AND user_id = ?", resumeID, userID).Count(&owned).Error; err != nil {
		return nil, err
	}
	if owned == 0 {
		return nil, ErrResumeNotFound
	}
	setting, err := s.ensureResumeSetting(userID, resumeID)
	if err != nil {
		return nil, err
	}
	updates := map[string]any{}
	if input.Visibility != nil {
		if *input.Visibility != "private" && *input.Visibility != "public" && *input.Visibility != "restricted" {
			return nil, errors.New("invalid visibility")
		}
		updates["visibility"] = *input.Visibility
		if *input.Visibility == "restricted" && setting.Visibility != "restricted" {
			code, codeErr := visitorCode()
			if codeErr != nil {
				return nil, codeErr
			}
			updates["visitor_code"] = code
		} else if *input.Visibility != "restricted" {
			updates["visitor_code"] = nil
		}
	}
	if input.AIEnabled != nil {
		updates["ai_enabled"] = *input.AIEnabled
	}
	if input.HasVisibleFields {
		for _, field := range input.VisibleFields {
			if !allowedVisibleFields[field] {
				return nil, errors.New("invalid visible field")
			}
		}
		updates["visible_fields"] = model.JSONConfig(mustJSON(input.VisibleFields))
	}
	if len(updates) > 0 {
		if err := s.db.Model(setting).Updates(updates).Error; err != nil {
			return nil, err
		}
	}
	if err := s.db.Where("resume_id = ? AND user_id = ?", resumeID, userID).First(setting).Error; err != nil {
		return nil, err
	}
	return setting, nil
}

func (s *AccessSettingService) ensureResumeSetting(userID, resumeID string) (*model.ResumeAccessSetting, error) {
	fields := []string{}
	setting := model.ResumeAccessSetting{ResumeID: resumeID, UserID: userID, Visibility: "private", VisibleFields: model.JSONConfig(mustJSON(fields))}
	err := s.db.Where("resume_id = ? AND user_id = ?", resumeID, userID).FirstOrCreate(&setting).Error
	return &setting, err
}

func visitorCode() (string, error) {
	var value uint32
	if err := binary.Read(rand.Reader, binary.BigEndian, &value); err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", value%1000000), nil
}
func mustJSON(value any) []byte { data, _ := json.Marshal(value); return data }
