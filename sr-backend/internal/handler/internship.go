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

type InternshipHandler struct {
	service *service.InternshipService
}

type saveInternshipRequest struct {
	ResumeID      string   `json:"resume_id" binding:"required,uuid"`
	CompanyName   string   `json:"company_name" binding:"required,max=200"`
	PositionTitle string   `json:"position_title" binding:"required,max=150"`
	Department    *string  `json:"department"`
	Location      *string  `json:"location"`
	StartDate     string   `json:"start_date" binding:"required"`
	EndDate       *string  `json:"end_date"`
	IsCurrent     bool     `json:"is_current"`
	Achievements  []string `json:"achievements"`
	Description   *string  `json:"description"`
}

func NewInternshipHandler(service *service.InternshipService) *InternshipHandler {
	return &InternshipHandler{service: service}
}

func (h *InternshipHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	var (
		items any
		err   error
	)
	if resumeID := c.Query("resume_id"); resumeID != "" {
		items, err = h.service.List(userID, resumeID)
	} else {
		items, err = h.service.ListAll(userID)
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "INTERNSHIP_LIST_FAILED", "获取实习经历失败")
		return
	}
	response.Success(c, gin.H{"internships": items})
}

func (h *InternshipHandler) Create(c *gin.Context) {
	input, ok := bindInternship(c)
	if !ok {
		return
	}
	item, err := h.service.Create(c.GetString(middleware.UserIDKey), input)
	h.writeSaved(c, item, err, true)
}

func (h *InternshipHandler) Update(c *gin.Context) {
	input, ok := bindInternship(c)
	if !ok {
		return
	}
	item, err := h.service.Update(c.GetString(middleware.UserIDKey), c.Param("id"), input)
	h.writeSaved(c, item, err, false)
}

func (h *InternshipHandler) Delete(c *gin.Context) {
	err := h.service.Delete(c.GetString(middleware.UserIDKey), c.Param("id"))
	if errors.Is(err, service.ErrInternshipNotFound) {
		response.Error(c, http.StatusNotFound, "INTERNSHIP_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "INTERNSHIP_DELETE_FAILED", "删除实习经历失败")
		return
	}
	response.Success(c, gin.H{})
}

func (h *InternshipHandler) Attach(c *gin.Context) {
	err := h.service.Attach(c.GetString(middleware.UserIDKey), c.Param("id"), c.Param("internshipId"))
	h.writeRelation(c, err, "加入当前简历失败")
}

func (h *InternshipHandler) Detach(c *gin.Context) {
	err := h.service.Detach(c.GetString(middleware.UserIDKey), c.Param("id"), c.Param("internshipId"))
	h.writeRelation(c, err, "从当前简历移除失败")
}

func bindInternship(c *gin.Context) (service.InternshipInput, bool) {
	var req saveInternshipRequest
	if err := c.ShouldBindJSON(&req); err != nil ||
		strings.TrimSpace(req.CompanyName) == "" ||
		strings.TrimSpace(req.PositionTitle) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_INTERNSHIP_INPUT", "公司名称、职位和开始时间为必填项")
		return service.InternshipInput{}, false
	}
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_INTERNSHIP_DATE", "开始时间格式不正确")
		return service.InternshipInput{}, false
	}
	var endDate *time.Time
	if !req.IsCurrent {
		if req.EndDate == nil || *req.EndDate == "" {
			response.Error(c, http.StatusBadRequest, "INVALID_INTERNSHIP_INPUT", "请选择结束时间或勾选至今")
			return service.InternshipInput{}, false
		}
		parsed, parseErr := time.Parse("2006-01-02", *req.EndDate)
		if parseErr != nil || parsed.Before(startDate) {
			response.Error(c, http.StatusBadRequest, "INVALID_INTERNSHIP_DATE", "结束时间不能早于开始时间")
			return service.InternshipInput{}, false
		}
		endDate = &parsed
	}
	return service.InternshipInput{
		ResumeID: req.ResumeID, CompanyName: req.CompanyName,
		PositionTitle: req.PositionTitle, Department: req.Department,
		Location: req.Location, StartDate: startDate, EndDate: endDate,
		IsCurrent: req.IsCurrent, Achievements: req.Achievements,
		Description: req.Description,
	}, true
}

func (h *InternshipHandler) writeSaved(c *gin.Context, item any, err error, created bool) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrInternshipNotFound) {
		response.Error(c, http.StatusNotFound, "INTERNSHIP_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "INTERNSHIP_SAVE_FAILED", "保存实习经历失败")
		return
	}
	if created {
		response.Created(c, gin.H{"internship": item})
		return
	}
	response.Success(c, gin.H{"internship": item})
}

func (h *InternshipHandler) writeRelation(c *gin.Context, err error, fallback string) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrInternshipNotFound) {
		response.Error(c, http.StatusNotFound, "INTERNSHIP_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "INTERNSHIP_RELATION_FAILED", fallback)
		return
	}
	response.Success(c, gin.H{})
}
