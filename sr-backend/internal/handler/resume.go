package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/middleware"
	"sr-backend/internal/service"
	"sr-backend/pkg/response"
)

type ResumeHandler struct {
	service *service.ResumeService
}

type createResumeRequest struct {
	Title       string `json:"title" binding:"max=150"`
	TemplateKey string `json:"template_key" binding:"omitempty,oneof=default professional creative traditional"`
}

type renameResumeRequest struct {
	Title       *string                     `json:"title" binding:"omitempty,max=150"`
	TemplateKey *string                     `json:"template_key" binding:"omitempty,oneof=default professional creative traditional"`
	Layout      *service.ResumeLayoutConfig `json:"layout"`
}

type saveBasicProfileRequest struct {
	ResumeID        string   `json:"resume_id" binding:"required,uuid"`
	TargetPosition  string   `json:"target_position" binding:"required,max=150"`
	FullName        string   `json:"full_name" binding:"required,max=100"`
	Gender          string   `json:"gender" binding:"required,oneof=male female other undisclosed"`
	Headline        *string  `json:"headline"`
	BirthDate       *string  `json:"birth_date"`
	Location        *string  `json:"location"`
	ContactEmail    *string  `json:"contact_email"`
	ContactPhone    *string  `json:"contact_phone"`
	WebsiteURL      *string  `json:"website_url"`
	GithubURL       *string  `json:"github_url"`
	LinkedinURL     *string  `json:"linkedin_url"`
	Summary         *string  `json:"summary"`
	YearsExperience *float64 `json:"years_of_experience"`
}

func NewResumeHandler(service *service.ResumeService) *ResumeHandler {
	return &ResumeHandler{service: service}
}

func (h *ResumeHandler) List(c *gin.Context) {
	resumes, err := h.service.List(c.GetString(middleware.UserIDKey))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "RESUME_LIST_FAILED", "获取简历列表失败")
		return
	}
	response.Success(c, gin.H{"resumes": resumes})
}

func (h *ResumeHandler) Create(c *gin.Context) {
	var req createResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_RESUME_TITLE", "简历名称不能超过 150 个字符")
		return
	}
	resume, err := h.service.Create(c.GetString(middleware.UserIDKey), req.Title, req.TemplateKey)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "RESUME_CREATE_FAILED", "新建简历失败")
		return
	}
	response.Created(c, gin.H{"resume": resume})
}

func (h *ResumeHandler) Rename(c *gin.Context) {
	var req renameResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Title == nil && req.TemplateKey == nil && req.Layout == nil) {
		response.Error(c, http.StatusBadRequest, "INVALID_RESUME_INPUT", "请提交有效的简历标题或模板")
		return
	}
	var resume interface{}
	var err error
	if req.Title != nil {
		if strings.TrimSpace(*req.Title) == "" {
			response.Error(c, http.StatusBadRequest, "INVALID_RESUME_TITLE", "请输入 1–150 个字符的简历标题")
			return
		}
		resume, err = h.service.Rename(c.GetString(middleware.UserIDKey), c.Param("id"), *req.Title)
	} else if req.TemplateKey != nil {
		resume, err = h.service.UpdateTemplate(c.GetString(middleware.UserIDKey), c.Param("id"), *req.TemplateKey)
	} else {
		resume, err = h.service.UpdateLayout(c.GetString(middleware.UserIDKey), c.Param("id"), *req.Layout)
	}
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "RESUME_RENAME_FAILED", "修改简历标题失败")
		return
	}
	response.Success(c, gin.H{"resume": resume})
}

func (h *ResumeHandler) Delete(c *gin.Context) {
	err := h.service.Delete(c.GetString(middleware.UserIDKey), c.Param("id"))
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "RESUME_DELETE_FAILED", "删除简历失败")
		return
	}
	response.Success(c, gin.H{})
}

func (h *ResumeHandler) BasicProfile(c *gin.Context) {
	profile, err := h.service.BasicProfile(c.GetString(middleware.UserIDKey))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PROFILE_READ_FAILED", "获取基本信息失败")
		return
	}
	response.Success(c, gin.H{"profile": profile})
}

func (h *ResumeHandler) SaveBasicProfile(c *gin.Context) {
	var req saveBasicProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil ||
		strings.TrimSpace(req.FullName) == "" ||
		strings.TrimSpace(req.TargetPosition) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_PROFILE_INPUT", "真实姓名、性别和求职方向为必填项")
		return
	}
	err := h.service.SaveBasicProfile(c.GetString(middleware.UserIDKey), service.BasicProfileInput{
		ResumeID: req.ResumeID, TargetPosition: req.TargetPosition,
		FullName: req.FullName, Gender: req.Gender, Headline: req.Headline,
		BirthDate: req.BirthDate, Location: req.Location, ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone, WebsiteURL: req.WebsiteURL, GithubURL: req.GithubURL,
		LinkedinURL: req.LinkedinURL, Summary: req.Summary, YearsExperience: req.YearsExperience,
	})
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PROFILE_SAVE_FAILED", "保存基本信息失败")
		return
	}
	response.Success(c, gin.H{})
}
