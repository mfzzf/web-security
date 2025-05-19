package routes

import (
	"web-security/backend/handlers"

	"github.com/gin-gonic/gin"
)

// SetupPaymentRoutes sets up the payment-related routes
func SetupPaymentRoutes(router *gin.RouterGroup) {
	// Order payment endpoints
	router.POST("/orders/:id/checkout", handlers.CreatePaymentSession)
	router.GET("/orders/:id/payment-status", handlers.CheckPaymentStatus)
	
	// Payment callback endpoints
	router.GET("/success", handlers.HandlePaymentSuccess)
	router.GET("/cancel", handlers.HandlePaymentCancel)
}
