package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"sr-backend/internal/config"
	"sr-backend/internal/database"
	"sr-backend/internal/handler"
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
		apiRoutes.GET("/profile/basic", resumeHandler.BasicProfile)
		apiRoutes.PUT("/profile/basic", resumeHandler.SaveBasicProfile)
	}

	log.Printf(
		"connected to PostgreSQL database %q; server listening on %s",
		cfg.Database.Name,
		cfg.ServerAddr,
	)
	if err := r.Run(cfg.ServerAddr); err != nil {
		log.Fatalf("start HTTP server: %v", err)
	}
}
