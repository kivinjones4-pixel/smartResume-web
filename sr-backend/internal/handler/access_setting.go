package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/middleware"
	"sr-backend/internal/service"
	"sr-backend/pkg/response"
)

type AccessSettingHandler struct{ service *service.AccessSettingService }

type saveAgentSettingRequest struct {
	LanguageStyle  string `json:"language_style" binding:"required,oneof=professional friendly concise enthusiastic"`
	WelcomeMessage string `json:"welcome_message" binding:"max=500"`
	AdditionalInfo string `json:"additional_info" binding:"max=5000"`
}

type updateResumeAccessRequest struct {
	Visibility    *string  `json:"visibility" binding:"omitempty,oneof=private public restricted"`
	AIEnabled     *bool    `json:"ai_enabled"`
	VisibleFields []string `json:"visible_fields"`
}

func NewAccessSettingHandler(service *service.AccessSettingService) *AccessSettingHandler {
	return &AccessSettingHandler{service: service}
}

func (h *AccessSettingHandler) Get(c *gin.Context) {
	agent, resumes, err := h.service.Get(c.GetString(middleware.UserIDKey))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ACCESS_SETTINGS_READ_FAILED", "读取访问设置失败")
		return
	}
	response.Success(c, gin.H{"agent_setting": agent, "resumes": resumes})
}

func (h *AccessSettingHandler) SaveAgent(c *gin.Context) {
	var req saveAgentSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_AGENT_SETTING", "请检查 AI 代理设置")
		return
	}
	agent, err := h.service.SaveAgent(c.GetString(middleware.UserIDKey), req.LanguageStyle, req.WelcomeMessage, req.AdditionalInfo)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AGENT_SETTING_SAVE_FAILED", "保存 AI 代理设置失败")
		return
	}
	response.Success(c, gin.H{"agent_setting": agent})
}

func (h *AccessSettingHandler) UpdateResume(c *gin.Context) {
	var req updateResumeAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_ACCESS_SETTING", "请检查简历访问设置")
		return
	}
	setting, err := h.service.UpdateResume(c.GetString(middleware.UserIDKey), c.Param("id"), service.ResumeAccessUpdate{Visibility: req.Visibility, AIEnabled: req.AIEnabled, VisibleFields: req.VisibleFields, HasVisibleFields: req.VisibleFields != nil})
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", "简历不存在")
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ACCESS_SETTING_SAVE_FAILED", "保存访问设置失败")
		return
	}
	response.Success(c, gin.H{"setting": setting})
}
