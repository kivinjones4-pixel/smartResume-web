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

type AwardHandler struct {
	service *service.AwardService
}

type saveAwardRequest struct {
	ResumeID       string  `json:"resume_id" binding:"required,uuid"`
	AwardName      string  `json:"award_name" binding:"required,max=200"`
	Issuer         string  `json:"issuer" binding:"required,max=200"`
	CertificateURL *string `json:"certificate_url"`
	Description    *string `json:"description"`
}

func NewAwardHandler(service *service.AwardService) *AwardHandler {
	return &AwardHandler{service: service}
}

func (h *AwardHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.UserIDKey)
	var items any
	var err error
	if resumeID := c.Query("resume_id"); resumeID != "" {
		items, err = h.service.List(userID, resumeID)
	} else {
		items, err = h.service.ListAll(userID)
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AWARD_LIST_FAILED", "获取获奖记录失败")
		return
	}
	response.Success(c, gin.H{"awards": items})
}

func (h *AwardHandler) Create(c *gin.Context) {
	input, ok := bindAward(c)
	if !ok {
		return
	}
	item, err := h.service.Create(c.GetString(middleware.UserIDKey), input)
	h.writeSaved(c, item, err, true)
}

func (h *AwardHandler) Update(c *gin.Context) {
	input, ok := bindAward(c)
	if !ok {
		return
	}
	item, err := h.service.Update(c.GetString(middleware.UserIDKey), c.Param("id"), input)
	h.writeSaved(c, item, err, false)
}

func (h *AwardHandler) Delete(c *gin.Context) {
	err := h.service.Delete(c.GetString(middleware.UserIDKey), c.Param("id"))
	if errors.Is(err, service.ErrAwardNotFound) {
		response.Error(c, http.StatusNotFound, "AWARD_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AWARD_DELETE_FAILED", "删除获奖记录失败")
		return
	}
	response.Success(c, gin.H{})
}

func (h *AwardHandler) Attach(c *gin.Context) {
	err := h.service.Attach(c.GetString(middleware.UserIDKey), c.Param("id"), c.Param("awardId"))
	h.writeRelation(c, err, "加入当前简历失败")
}

func (h *AwardHandler) Detach(c *gin.Context) {
	err := h.service.Detach(c.GetString(middleware.UserIDKey), c.Param("id"), c.Param("awardId"))
	h.writeRelation(c, err, "从当前简历移除失败")
}

func bindAward(c *gin.Context) (service.AwardInput, bool) {
	var req saveAwardRequest
	if err := c.ShouldBindJSON(&req); err != nil ||
		strings.TrimSpace(req.AwardName) == "" ||
		strings.TrimSpace(req.Issuer) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_AWARD_INPUT", "奖项名称和颁发机构为必填项")
		return service.AwardInput{}, false
	}
	return service.AwardInput{
		ResumeID: req.ResumeID, AwardName: req.AwardName, Issuer: req.Issuer,
		CertificateURL: req.CertificateURL, Description: req.Description,
	}, true
}

func (h *AwardHandler) writeSaved(c *gin.Context, item any, err error, created bool) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrAwardNotFound) {
		response.Error(c, http.StatusNotFound, "AWARD_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AWARD_SAVE_FAILED", "保存获奖记录失败")
		return
	}
	if created {
		response.Created(c, gin.H{"award": item})
		return
	}
	response.Success(c, gin.H{"award": item})
}

func (h *AwardHandler) writeRelation(c *gin.Context, err error, fallback string) {
	if errors.Is(err, service.ErrResumeNotFound) {
		response.Error(c, http.StatusNotFound, "RESUME_NOT_FOUND", err.Error())
		return
	}
	if errors.Is(err, service.ErrAwardNotFound) {
		response.Error(c, http.StatusNotFound, "AWARD_NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AWARD_RELATION_FAILED", fallback)
		return
	}
	response.Success(c, gin.H{})
}
