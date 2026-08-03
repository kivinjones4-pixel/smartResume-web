package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/agent"
	"sr-backend/internal/knowledge"
	"sr-backend/pkg/response"
)

type AssistantHandler struct {
	service *agent.Service
}

type assistantChatRequest struct {
	Message string `json:"message" binding:"required,max=2000"`
}

func NewAssistantHandler(service *agent.Service) *AssistantHandler {
	return &AssistantHandler{service: service}
}

func (h *AssistantHandler) Chat(c *gin.Context) {
	var request assistantChatRequest
	if err := c.ShouldBindJSON(&request); err != nil || strings.TrimSpace(request.Message) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_ASSISTANT_MESSAGE", "请输入 1–2000 个字符的问题")
		return
	}
	answer, err := h.service.Ask(c.Request.Context(), request.Message)
	if err != nil {
		log.Printf("assistant chat failed: %v", err)
		response.Error(c, http.StatusBadGateway, "ASSISTANT_UNAVAILABLE", "KK 暂时无法回答，请稍后再试")
		return
	}
	response.Success(c, answer)
}

func (h *AssistantHandler) Stream(c *gin.Context) {
	var request assistantChatRequest
	if err := c.ShouldBindJSON(&request); err != nil || strings.TrimSpace(request.Message) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_ASSISTANT_MESSAGE", "请输入 1–2000 个字符的问题")
		return
	}
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		response.Error(c, http.StatusInternalServerError, "STREAM_UNSUPPORTED", "当前服务不支持流式回答")
		return
	}
	c.Header("Content-Type", "text/event-stream; charset=utf-8")
	c.Header("Cache-Control", "no-cache, no-transform")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)
	writeEvent := func(event string, value any) error {
		data, err := json.Marshal(value)
		if err != nil {
			return err
		}
		if _, err := fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event, data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}
	err := h.service.StreamAsk(
		c.Request.Context(),
		request.Message,
		func(sources []knowledge.SearchResult) error { return writeEvent("sources", sources) },
		func(content string) error { return writeEvent("delta", gin.H{"content": content}) },
	)
	if err != nil {
		log.Printf("assistant stream failed: %v", err)
		_ = writeEvent("error", gin.H{"message": "KK 暂时无法回答，请稍后再试"})
		return
	}
	_ = writeEvent("done", gin.H{})
}
