package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/middleware"
	"sr-backend/internal/service"
)

type ResumeHandler struct {
	service *service.ResumeService
}

type createResumeRequest struct {
	Title string `json:"title" binding:"max=150"`
}

type renameResumeRequest struct {
	Title string `json:"title" binding:"required,max=150"`
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
		c.JSON(http.StatusInternalServerError, gin.H{"message": "获取简历列表失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"resumes": resumes})
}

func (h *ResumeHandler) Create(c *gin.Context) {
	var req createResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "简历名称不能超过 150 个字符"})
		return
	}
	resume, err := h.service.Create(c.GetString(middleware.UserIDKey), req.Title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "新建简历失败"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"resume": resume})
}

func (h *ResumeHandler) Rename(c *gin.Context) {
	var req renameResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "请输入 1–150 个字符的简历标题"})
		return
	}
	resume, err := h.service.Rename(
		c.GetString(middleware.UserIDKey),
		c.Param("id"),
		req.Title,
	)
	if errors.Is(err, service.ErrResumeNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "修改简历标题失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"resume": resume})
}

func (h *ResumeHandler) Delete(c *gin.Context) {
	err := h.service.Delete(c.GetString(middleware.UserIDKey), c.Param("id"))
	if errors.Is(err, service.ErrResumeNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "删除简历失败"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ResumeHandler) BasicProfile(c *gin.Context) {
	profile, err := h.service.BasicProfile(c.GetString(middleware.UserIDKey))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "获取基本信息失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

func (h *ResumeHandler) SaveBasicProfile(c *gin.Context) {
	var req saveBasicProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil ||
		strings.TrimSpace(req.FullName) == "" ||
		strings.TrimSpace(req.TargetPosition) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "真实姓名、性别和求职方向为必填项"})
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
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "保存基本信息失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "基本信息已保存"})
}
