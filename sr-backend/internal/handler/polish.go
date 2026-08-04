package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/agent"
	"sr-backend/pkg/response"
)

type PolishHandler struct {
	service *agent.PolishService
}

func NewPolishHandler(service *agent.PolishService) *PolishHandler {
	return &PolishHandler{service: service}
}

func (h *PolishHandler) Record(c *gin.Context) {
	var request agent.PolishRequest
	if err := c.ShouldBindJSON(&request); err != nil || strings.TrimSpace(request.Module) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_POLISH_INPUT", "润色内容格式不正确")
		return
	}
	result, err := h.service.Polish(c.Request.Context(), request)
	if err != nil {
		if strings.Contains(err.Error(), "unsupported resume module") || strings.Contains(err.Error(), "no polishable content") {
			response.Error(c, http.StatusBadRequest, "INVALID_POLISH_INPUT", "请先填写需要润色的描述或成就")
			return
		}
		log.Printf("AI record polish failed module=%s: %v", request.Module, err)
		response.Error(c, http.StatusBadGateway, "AI_POLISH_UNAVAILABLE", "AI 润色暂时不可用，请稍后再试")
		return
	}
	response.Success(c, result)
}

func (h *PolishHandler) Resume(c *gin.Context) {
	var request agent.ResumePolishRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_POLISH_INPUT", "简历润色内容格式不正确")
		return
	}
	result, err := h.service.PolishResume(c.Request.Context(), request)
	if err != nil {
		if strings.Contains(err.Error(), "no polishable content") {
			response.Error(c, http.StatusBadRequest, "INVALID_POLISH_INPUT", "请先完善简历中的描述或成就")
			return
		}
		log.Printf("AI resume polish failed items=%d: %v", len(request.Items), err)
		response.Error(c, http.StatusBadGateway, "AI_POLISH_UNAVAILABLE", "AI 润色暂时不可用，请稍后再试")
		return
	}
	response.Success(c, result)
}
