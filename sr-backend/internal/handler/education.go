package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/middleware"
	"sr-backend/internal/service"
	"sr-backend/pkg/response"
)

type EducationHandler struct {
	service *service.EducationService
}

type saveEducationRequest struct {
	ResumeID     string  `json:"resume_id" binding:"required,uuid"`
	SchoolName   string  `json:"school_name" binding:"required,max=200"`
	Degree       *string `json:"degree"`
	FieldOfStudy *string `json:"field_of_study"`
	Location     *string `json:"location"`
	StartDate    string  `json:"start_date" binding:"required"`
	EndDate      *string `json:"end_date"`
	IsCurrent    bool    `json:"is_current"`
	GPA          *string `json:"gpa"`
	Description  *string `json:"description"`
}

func NewEducationHandler(service *service.EducationService) *EducationHandler {
	return &EducationHandler{service: service}
}

func (h *EducationHandler) List(c *gin.Context) {
	resumeID := c.Query("resume_id")
	if resumeID == "" {
		educations, err := h.service.ListAll(c.GetString(middleware.UserIDKey))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "EDUCATION_LIST_FAILED", "获取教育经历失败")
			return
		}
		response.Success(c, gin.H{"educations": educations})
		return
	}
	educations, err := h.service.List(c.GetString(middleware.UserIDKey), resumeID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "EDUCATION_LIST_FAILED", "获取教育经历失败")
		return
	}
	response.Success(c, gin.H{"educations": educations})
}

func (h *EducationHandler) Attach(c *gin.Context) {
	err := h.service.Attach(
		c.GetString(middleware.UserIDKey),
		c.Param("id"),
		c.Param("educationId"),
	)
	h.writeRelation(c, err, "加入当前简历失败")
}

func (h *EducationHandler) Detach(c *gin.Context) {
	err := h.service.Detach(
		c.GetString(middleware.UserIDKey),
		c.Param("id"),
		c.Param("educationId"),
	)
	h.writeRelation(c, err, "从当前简历移除失败")
}

func (h *EducationHandler) Create(c *gin.Context) {
	input, ok := bindEducation(c)
	if !ok {
		return
	}
	education, err := h.service.Create(c.GetString(middleware.UserIDKey), input)
	h.writeSaved(c, education, err, true)
}

func (h *EducationHandler) writeRelation(c *gin.Context, err error, fallback string) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrEducationNotFound) {
		response.Error(c, http.StatusNotFound, "EDUCATION_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "EDUCATION_RELATION_FAILED", fallback)
		return
	}
	response.Success(c, gin.H{})
}

func (h *EducationHandler) Update(c *gin.Context) {
	input, ok := bindEducation(c)
	if !ok {
		return
	}
	education, err := h.service.Update(c.GetString(middleware.UserIDKey), c.Param("id"), input)
	h.writeSaved(c, education, err, false)
}

func (h *EducationHandler) Delete(c *gin.Context) {
	err := h.service.Delete(c.GetString(middleware.UserIDKey), c.Param("id"))
	if errors.Is(err, service.ErrEducationNotFound) {
		response.Error(c, http.StatusNotFound, "EDUCATION_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "EDUCATION_DELETE_FAILED", "删除教育经历失败")
		return
	}
	response.Success(c, gin.H{})
}

func bindEducation(c *gin.Context) (service.EducationInput, bool) {
	var req saveEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.SchoolName) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_EDUCATION_INPUT", "学校名称和开始时间为必填项")
		return service.EducationInput{}, false
	}
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_EDUCATION_DATE", "开始时间格式不正确")
		return service.EducationInput{}, false
	}
	var endDate *time.Time
	if !req.IsCurrent {
		if req.EndDate == nil || *req.EndDate == "" {
			response.Error(c, http.StatusBadRequest, "INVALID_EDUCATION_INPUT", "请选择结束时间或勾选至今")
			return service.EducationInput{}, false
		}
		parsed, parseErr := time.Parse("2006-01-02", *req.EndDate)
		if parseErr != nil || parsed.Before(startDate) {
			response.Error(c, http.StatusBadRequest, "INVALID_EDUCATION_DATE", "结束时间不能早于开始时间")
			return service.EducationInput{}, false
		}
		endDate = &parsed
	}
	return service.EducationInput{
		ResumeID: req.ResumeID, SchoolName: req.SchoolName, Degree: req.Degree,
		FieldOfStudy: req.FieldOfStudy, Location: req.Location, StartDate: startDate,
		EndDate: endDate, IsCurrent: req.IsCurrent, GPA: req.GPA, Description: req.Description,
	}, true
}

func (h *EducationHandler) writeSaved(c *gin.Context, education any, err error, created bool) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrEducationNotFound) {
		response.Error(c, http.StatusNotFound, "EDUCATION_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "EDUCATION_SAVE_FAILED", "保存教育经历失败")
		return
	}
	if created {
		response.Created(c, gin.H{"education": education})
		return
	}
	response.Success(c, gin.H{"education": education})
}
