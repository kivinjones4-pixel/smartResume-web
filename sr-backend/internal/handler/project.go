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

type ProjectHandler struct {
	service *service.ProjectService
}

type saveProjectRequest struct {
	ResumeID      string   `json:"resume_id" binding:"required,uuid"`
	ProjectName   string   `json:"project_name" binding:"required,max=200"`
	RoleName      string   `json:"role_name" binding:"required,max=150"`
	ProjectURL    *string  `json:"project_url"`
	RepositoryURL *string  `json:"repository_url"`
	StartDate     string   `json:"start_date" binding:"required"`
	EndDate       *string  `json:"end_date"`
	IsCurrent     bool     `json:"is_current"`
	Achievements  []string `json:"achievements"`
	Description   *string  `json:"description"`
}

func NewProjectHandler(service *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{service: service}
}

func (h *ProjectHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	var items any
	var err error
	if resumeID := c.Query("resume_id"); resumeID != "" {
		items, err = h.service.List(userID, resumeID)
	} else {
		items, err = h.service.ListAll(userID)
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PROJECT_LIST_FAILED", "获取项目经历失败")
		return
	}
	response.Success(c, gin.H{"project_experiences": items})
}

func (h *ProjectHandler) Create(c *gin.Context) {
	input, ok := bindProject(c)
	if !ok {
		return
	}
	item, err := h.service.Create(c.GetString(middleware.UserIDKey), input)
	h.writeSaved(c, item, err, true)
}

func (h *ProjectHandler) Update(c *gin.Context) {
	input, ok := bindProject(c)
	if !ok {
		return
	}
	item, err := h.service.Update(c.GetString(middleware.UserIDKey), c.Param("id"), input)
	h.writeSaved(c, item, err, false)
}

func (h *ProjectHandler) Delete(c *gin.Context) {
	err := h.service.Delete(c.GetString(middleware.UserIDKey), c.Param("id"))
	if errors.Is(err, service.ErrProjectNotFound) {
		response.Error(c, http.StatusNotFound, "PROJECT_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PROJECT_DELETE_FAILED", "删除项目经历失败")
		return
	}
	response.Success(c, gin.H{})
}

func (h *ProjectHandler) Attach(c *gin.Context) {
	err := h.service.Attach(c.GetString(middleware.UserIDKey), c.Param("id"), c.Param("projectId"))
	h.writeRelation(c, err, "加入当前简历失败")
}

func (h *ProjectHandler) Detach(c *gin.Context) {
	err := h.service.Detach(c.GetString(middleware.UserIDKey), c.Param("id"), c.Param("projectId"))
	h.writeRelation(c, err, "从当前简历移除失败")
}

func bindProject(c *gin.Context) (service.ProjectInput, bool) {
	var req saveProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil ||
		strings.TrimSpace(req.ProjectName) == "" ||
		strings.TrimSpace(req.RoleName) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_PROJECT_INPUT", "项目名、担任角色和开始时间为必填项")
		return service.ProjectInput{}, false
	}
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_PROJECT_DATE", "开始时间格式不正确")
		return service.ProjectInput{}, false
	}
	var endDate *time.Time
	if !req.IsCurrent {
		if req.EndDate == nil || *req.EndDate == "" {
			response.Error(c, http.StatusBadRequest, "INVALID_PROJECT_INPUT", "请选择结束时间或勾选至今")
			return service.ProjectInput{}, false
		}
		parsed, parseErr := time.Parse("2006-01-02", *req.EndDate)
		if parseErr != nil || parsed.Before(startDate) {
			response.Error(c, http.StatusBadRequest, "INVALID_PROJECT_DATE", "结束时间不能早于开始时间")
			return service.ProjectInput{}, false
		}
		endDate = &parsed
	}
	return service.ProjectInput{
		ResumeID: req.ResumeID, ProjectName: req.ProjectName, RoleName: req.RoleName,
		ProjectURL: req.ProjectURL, RepositoryURL: req.RepositoryURL,
		StartDate: startDate, EndDate: endDate, IsCurrent: req.IsCurrent,
		Achievements: req.Achievements, Description: req.Description,
	}, true
}

func (h *ProjectHandler) writeSaved(c *gin.Context, item any, err error, created bool) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrProjectNotFound) {
		response.Error(c, http.StatusNotFound, "PROJECT_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PROJECT_SAVE_FAILED", "保存项目经历失败")
		return
	}
	if created {
		response.Created(c, gin.H{"project_experience": item})
		return
	}
	response.Success(c, gin.H{"project_experience": item})
}

func (h *ProjectHandler) writeRelation(c *gin.Context, err error, fallback string) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrProjectNotFound) {
		response.Error(c, http.StatusNotFound, "PROJECT_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PROJECT_RELATION_FAILED", fallback)
		return
	}
	response.Success(c, gin.H{})
}
