package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Body struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data any    `json:"data"`
}

// Success writes the project-standard success envelope.
func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Body{Code: 0, Msg: "success", Data: data})
}

// Created writes a successful resource-creation response.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, Body{Code: 0, Msg: "success", Data: data})
}

// Error writes the project-standard failure envelope without leaking internal errors.
func Error(c *gin.Context, status int, errorCode, message string) {
	c.JSON(status, Body{
		Code: 1,
		Msg:  message,
		Data: gin.H{"error_code": errorCode},
	})
}
