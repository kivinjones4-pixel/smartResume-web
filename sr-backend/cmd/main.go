package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/agent"
	"sr-backend/internal/agent/chat"
	"sr-backend/internal/agent/embedding"
	"sr-backend/internal/config"
	"sr-backend/internal/database"
	"sr-backend/internal/handler"
	"sr-backend/internal/knowledge"
	"sr-backend/internal/middleware"
	"sr-backend/internal/service"
	"sr-backend/pkg/response"
)

func main() {
	cfg := config.Load()

	postgresDB, err := database.Open(context.Background(), cfg.Database)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer func() {
		if err := postgresDB.Close(); err != nil {
			log.Printf("close database connection: %v", err)
		}
	}()

	r := gin.Default()
	r.Use(middleware.CORS(cfg.FrontendURL))

	authService := service.NewAuthService(postgresDB.DB, cfg.Auth)
	authHandler := handler.NewAuthHandler(authService, cfg.Auth)
	resumeService := service.NewResumeService(postgresDB.DB)
	resumeHandler := handler.NewResumeHandler(resumeService)
	accessSettingHandler := handler.NewAccessSettingHandler(service.NewAccessSettingService(postgresDB.DB))
	educationService := service.NewEducationService(postgresDB.DB)
	educationHandler := handler.NewEducationHandler(educationService)
	internshipService := service.NewInternshipService(postgresDB.DB)
	internshipHandler := handler.NewInternshipHandler(internshipService)
	workService := service.NewWorkService(postgresDB.DB)
	workHandler := handler.NewWorkHandler(workService)
	projectService := service.NewProjectService(postgresDB.DB)
	projectHandler := handler.NewProjectHandler(projectService)
	awardService := service.NewAwardService(postgresDB.DB)
	awardHandler := handler.NewAwardHandler(awardService)
	if err := cfg.AI.ValidateEmbedding(); err != nil {
		log.Fatalf("invalid embedding configuration: %v", err)
	}
	if err := cfg.AI.ValidateChat(); err != nil {
		log.Fatalf("invalid chat configuration: %v", err)
	}
	embeddingClient, err := embedding.NewOpenAICompatibleClient(
		cfg.AI.Embedding, cfg.AI.EmbeddingDimensions, cfg.AI.TimeoutSeconds,
	)
	if err != nil {
		log.Fatalf("create embedding client: %v", err)
	}
	chatClient, err := chat.NewOpenAICompatibleClient(cfg.AI.Chat, cfg.AI.TimeoutSeconds)
	if err != nil {
		log.Fatalf("create chat client: %v", err)
	}
	polishChatClient, err := chat.NewOpenAICompatibleClient(cfg.AI.Chat, cfg.AI.PolishTimeoutSeconds)
	if err != nil {
		log.Fatalf("create polish chat client: %v", err)
	}
	assistantService, err := agent.NewService(
		cfg, chatClient, embeddingClient, knowledge.NewRepository(postgresDB.SQL),
	)
	if err != nil {
		log.Fatalf("create assistant service: %v", err)
	}
	assistantHandler := handler.NewAssistantHandler(assistantService)
	polishHandler := handler.NewPolishHandler(agent.NewPolishService(polishChatClient))

	r.GET("/ping", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := postgresDB.SQL.PingContext(ctx); err != nil {
			response.Error(c, http.StatusServiceUnavailable, "DATABASE_UNAVAILABLE", "service unavailable")
			return
		}

		response.Success(c, gin.H{
			"message":  "pong",
			"database": "ok",
		})
	})

	authRoutes := r.Group("/api/v1/auth")
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/refresh", authHandler.Refresh)
		authRoutes.POST("/logout", authHandler.Logout)
		authRoutes.GET("/me", middleware.RequireAuth(authService), authHandler.Me)
	}

	apiRoutes := r.Group("/api/v1", middleware.RequireAuth(authService))
	{
		apiRoutes.GET("/resumes", resumeHandler.List)
		apiRoutes.POST("/resumes", resumeHandler.Create)
		apiRoutes.PATCH("/resumes/:id", resumeHandler.Rename)
		apiRoutes.DELETE("/resumes/:id", resumeHandler.Delete)
		apiRoutes.GET("/access-settings", accessSettingHandler.Get)
		apiRoutes.PUT("/access-settings/agent", accessSettingHandler.SaveAgent)
		apiRoutes.PATCH("/access-settings/resumes/:id", accessSettingHandler.UpdateResume)
		apiRoutes.GET("/profile/basic", resumeHandler.BasicProfile)
		apiRoutes.PUT("/profile/basic", resumeHandler.SaveBasicProfile)
		apiRoutes.GET("/educations", educationHandler.List)
		apiRoutes.POST("/educations", educationHandler.Create)
		apiRoutes.PUT("/educations/:id", educationHandler.Update)
		apiRoutes.DELETE("/educations/:id", educationHandler.Delete)
		apiRoutes.POST("/resumes/:id/educations/:educationId", educationHandler.Attach)
		apiRoutes.DELETE("/resumes/:id/educations/:educationId", educationHandler.Detach)
		apiRoutes.GET("/internships", internshipHandler.List)
		apiRoutes.POST("/internships", internshipHandler.Create)
		apiRoutes.PUT("/internships/:id", internshipHandler.Update)
		apiRoutes.DELETE("/internships/:id", internshipHandler.Delete)
		apiRoutes.POST("/resumes/:id/internships/:internshipId", internshipHandler.Attach)
		apiRoutes.DELETE("/resumes/:id/internships/:internshipId", internshipHandler.Detach)
		apiRoutes.GET("/work-experiences", workHandler.List)
		apiRoutes.POST("/work-experiences", workHandler.Create)
		apiRoutes.PUT("/work-experiences/:id", workHandler.Update)
		apiRoutes.DELETE("/work-experiences/:id", workHandler.Delete)
		apiRoutes.POST("/resumes/:id/work-experiences/:workId", workHandler.Attach)
		apiRoutes.DELETE("/resumes/:id/work-experiences/:workId", workHandler.Detach)
		apiRoutes.GET("/project-experiences", projectHandler.List)
		apiRoutes.POST("/project-experiences", projectHandler.Create)
		apiRoutes.PUT("/project-experiences/:id", projectHandler.Update)
		apiRoutes.DELETE("/project-experiences/:id", projectHandler.Delete)
		apiRoutes.POST("/resumes/:id/project-experiences/:projectId", projectHandler.Attach)
		apiRoutes.DELETE("/resumes/:id/project-experiences/:projectId", projectHandler.Detach)
		apiRoutes.GET("/awards", awardHandler.List)
		apiRoutes.POST("/awards", awardHandler.Create)
		apiRoutes.PUT("/awards/:id", awardHandler.Update)
		apiRoutes.DELETE("/awards/:id", awardHandler.Delete)
		apiRoutes.POST("/resumes/:id/awards/:awardId", awardHandler.Attach)
		apiRoutes.DELETE("/resumes/:id/awards/:awardId", awardHandler.Detach)
		apiRoutes.POST("/assistant/chat", assistantHandler.Chat)
		apiRoutes.POST("/assistant/chat/stream", assistantHandler.Stream)
		apiRoutes.POST("/ai-polish/record", polishHandler.Record)
		apiRoutes.POST("/ai-polish/resume", polishHandler.Resume)
	}

	log.Printf(
		"connected to PostgreSQL database %q; RAG provider=%s model=%s vector_threshold=%.4f final_top_k=%d; server listening on %s",
		cfg.Database.Name,
		cfg.AI.Embedding.Provider,
		cfg.AI.Embedding.Model,
		cfg.Assistant.RAGVectorMinSimilarity,
		cfg.Assistant.RAGFinalTopK,
		cfg.ServerAddr,
	)
	if err := r.Run(cfg.ServerAddr); err != nil {
		log.Fatalf("start HTTP server: %v", err)
	}
}
