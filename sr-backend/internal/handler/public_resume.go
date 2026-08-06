package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sr-backend/internal/agent"
	"sr-backend/internal/agent/chat"
	"sr-backend/internal/config"
	"sr-backend/internal/middleware"
	"sr-backend/internal/model"
	"sr-backend/internal/service"
	"sr-backend/pkg/response"
)

type PublicResumeHandler struct {
	db     *gorm.DB
	agent  *agent.ResumeAgentService
	secret []byte
}

type visitorClaims struct {
	ResumeID  string `json:"resume_id"`
	ExpiresAt int64  `json:"expires_at"`
}
type publicChatRequest struct {
	Message string         `json:"message" binding:"required,max=2000"`
	History []chat.Message `json:"history" binding:"max=20"`
}

type publicResumeData struct {
	Resume             *model.Resume             `json:"resume"`
	Profile            *model.UserProfile        `json:"profile"`
	Educations         []model.Education         `json:"educations"`
	Internships        []model.Internship        `json:"internships"`
	WorkExperiences    []model.WorkExperience    `json:"work_experiences"`
	ProjectExperiences []model.ProjectExperience `json:"project_experiences"`
	Awards             []model.Award             `json:"awards"`
	AIEnabled          bool                      `json:"ai_enabled"`
	WelcomeMessage     string                    `json:"welcome_message"`
}

func NewPublicResumeHandler(db *gorm.DB, agentService *agent.ResumeAgentService, cfg config.AuthConfig) *PublicResumeHandler {
	return &PublicResumeHandler{db: db, agent: agentService, secret: []byte(cfg.AccessSecret)}
}

func (h *PublicResumeHandler) Access(c *gin.Context) {
	var body struct {
		Code string `json:"code" binding:"required,len=6"`
	}
	if c.ShouldBindJSON(&body) != nil {
		response.Error(c, http.StatusBadRequest, "INVALID_VISITOR_CODE", "请输入六位访客码")
		return
	}
	resume, setting, err := h.lookup(c.Param("id"))
	if err != nil || setting.Visibility != "restricted" || setting.VisitorCode == nil || *setting.VisitorCode != body.Code {
		response.Error(c, http.StatusForbidden, "INVALID_VISITOR_CODE", "访客码不正确")
		return
	}
	token := h.signVisitor(resume.ID)
	response.Success(c, gin.H{"visitor_token": token})
}

func (h *PublicResumeHandler) Get(c *gin.Context) {
	resume, setting, err := h.lookup(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusNotFound, "PUBLIC_RESUME_NOT_FOUND", "简历不可访问")
		return
	}
	isOwner := c.GetString(middleware.UserIDKey) == resume.UserID
	if setting.Visibility == "private" && !isOwner {
		response.Error(c, http.StatusForbidden, "PRIVATE_RESUME", "简历不可访问")
		return
	}
	if setting.Visibility == "restricted" && !isOwner && !h.validVisitor(c.GetHeader("X-Visitor-Token"), resume.ID) {
		response.Error(c, http.StatusForbidden, "VISITOR_CODE_REQUIRED", "请输入访客码")
		return
	}
	data, err := h.resumeData(resume, setting)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "PUBLIC_RESUME_READ_FAILED", "读取简历失败")
		return
	}
	response.Success(c, data)
}

func (h *PublicResumeHandler) Stream(c *gin.Context) {
	resume, setting, err := h.lookup(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusForbidden, "PUBLIC_CHAT_DISABLED", "AI 问答未启用")
		return
	}
	isOwner := c.GetString(middleware.UserIDKey) == resume.UserID
	if (setting.Visibility == "private" && !isOwner) || !setting.AIEnabled {
		response.Error(c, http.StatusForbidden, "PUBLIC_CHAT_DISABLED", "AI 问答未启用")
		return
	}
	if setting.Visibility == "restricted" && !isOwner && !h.validVisitor(c.GetHeader("X-Visitor-Token"), resume.ID) {
		response.Error(c, http.StatusForbidden, "VISITOR_CODE_REQUIRED", "请输入访客码")
		return
	}
	var req publicChatRequest
	if c.ShouldBindJSON(&req) != nil || strings.TrimSpace(req.Message) == "" {
		response.Error(c, http.StatusBadRequest, "INVALID_MESSAGE", "请输入问题")
		return
	}
	if c.GetString(middleware.UserIDKey) == "" {
		if err := h.consumeAnonymous(c.GetHeader("X-Device-ID")); err != nil {
			response.Error(c, http.StatusTooManyRequests, "DAILY_LIMIT_REACHED", err.Error())
			return
		}
	}
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		response.Error(c, http.StatusInternalServerError, "STREAM_UNSUPPORTED", "不支持流式回答")
		return
	}
	c.Header("Content-Type", "text/event-stream; charset=utf-8")
	c.Header("Cache-Control", "no-cache, no-transform")
	c.Header("X-Accel-Buffering", "no")
	c.Status(200)
	write := func(event string, value any) error {
		data, _ := json.Marshal(value)
		_, err := fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", event, data)
		flusher.Flush()
		return err
	}
	err = h.agent.Stream(c.Request.Context(), resume.UserID, resume.ID, req.History, req.Message, func(delta string) error {
		return write("delta", gin.H{"content": delta})
	})
	if err != nil {
		_ = write("error", gin.H{"message": "AI 代理暂时无法回答"})
		return
	}
	_ = write("done", gin.H{})
}

func (h *PublicResumeHandler) lookup(id string) (*model.Resume, *model.ResumeAccessSetting, error) {
	var resume model.Resume
	if err := h.db.Where("id = ?", id).First(&resume).Error; err != nil {
		return nil, nil, err
	}
	var setting model.ResumeAccessSetting
	if err := h.db.Where("resume_id = ?", id).First(&setting).Error; err != nil {
		return nil, nil, err
	}
	return &resume, &setting, nil
}

func (h *PublicResumeHandler) resumeData(resume *model.Resume, setting *model.ResumeAccessSetting) (*publicResumeData, error) {
	var profile model.UserProfile
	if err := h.db.Where("user_id = ?", resume.UserID).First(&profile).Error; err != nil {
		return nil, err
	}
	var fields []string
	if err := json.Unmarshal([]byte(setting.VisibleFields), &fields); err != nil {
		return nil, fmt.Errorf("decode visible resume fields: %w", err)
	}
	allowed := map[string]bool{}
	for _, f := range fields {
		allowed[f] = true
	}
	if !allowed["full_name"] {
		profile.FullName = ""
	}
	if !allowed["birth_date"] {
		profile.BirthDate = nil
	}
	if !allowed["contact_phone"] {
		profile.ContactPhone = nil
	}
	if !allowed["contact_email"] {
		profile.ContactEmail = nil
	}
	if !allowed["location"] {
		profile.Location = nil
	}
	if !allowed["github_url"] {
		profile.GithubURL = nil
	}
	if !allowed["website_url"] {
		profile.WebsiteURL = nil
	}
	edu, e := service.NewEducationService(h.db).List(resume.UserID, resume.ID)
	if e != nil {
		return nil, e
	}
	internships, e := service.NewInternshipService(h.db).List(resume.UserID, resume.ID)
	if e != nil {
		return nil, e
	}
	works, e := service.NewWorkService(h.db).List(resume.UserID, resume.ID)
	if e != nil {
		return nil, e
	}
	projects, e := service.NewProjectService(h.db).List(resume.UserID, resume.ID)
	if e != nil {
		return nil, e
	}
	awards, e := service.NewAwardService(h.db).List(resume.UserID, resume.ID)
	if e != nil {
		return nil, e
	}
	var agentSetting model.UserAIAgentSetting
	if err := h.db.Where("user_id = ?", resume.UserID).First(&agentSetting).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("read AI agent setting: %w", err)
	}
	return &publicResumeData{
		Resume:             resume,
		Profile:            &profile,
		Educations:         edu,
		Internships:        internships,
		WorkExperiences:    works,
		ProjectExperiences: projects,
		Awards:             awards,
		AIEnabled:          setting.AIEnabled,
		WelcomeMessage:     agentSetting.WelcomeMessage,
	}, nil
}

func (h *PublicResumeHandler) signVisitor(resumeID string) string {
	data, _ := json.Marshal(visitorClaims{ResumeID: resumeID, ExpiresAt: time.Now().Add(12 * time.Hour).Unix()})
	payload := base64.RawURLEncoding.EncodeToString(data)
	mac := hmac.New(sha256.New, h.secret)
	mac.Write([]byte(payload))
	return payload + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (h *PublicResumeHandler) validVisitor(token, resumeID string) bool {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return false
	}
	mac := hmac.New(sha256.New, h.secret)
	mac.Write([]byte(parts[0]))
	sig, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || !hmac.Equal(sig, mac.Sum(nil)) {
		return false
	}
	data, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return false
	}
	var claims visitorClaims
	return json.Unmarshal(data, &claims) == nil && claims.ResumeID == resumeID && claims.ExpiresAt > time.Now().Unix()
}

func (h *PublicResumeHandler) consumeAnonymous(deviceID string) error {
	deviceID = strings.TrimSpace(deviceID)
	if len(deviceID) < 16 {
		return errors.New("无法识别当前设备")
	}
	sum := sha256.Sum256([]byte(deviceID))
	hash := hex.EncodeToString(sum[:])
	result := h.db.Exec(`INSERT INTO visitor_ai_daily_usage(device_hash, usage_date, question_count) VALUES (?, CURRENT_DATE, 1) ON CONFLICT(device_hash, usage_date) DO UPDATE SET question_count = visitor_ai_daily_usage.question_count + 1, updated_at = CURRENT_TIMESTAMP WHERE visitor_ai_daily_usage.question_count < 3`, hash)
	if result.Error != nil {
		return errors.New("统计匿名问答次数失败")
	}
	if result.RowsAffected == 0 {
		return errors.New("未登录用户每天最多提问 3 次，请登录后继续")
	}
	return nil
}
