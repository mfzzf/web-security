package routes

import (
	"web-security/backend/handlers"
	"web-security/backend/middleware" // For authentication middleware

	"github.com/gin-gonic/gin"
)

// SetupOrderRoutes sets up the order-related routes
func SetupOrderRoutes(router *gin.RouterGroup) { // router is effectively /api/orders
	// Route for creating an order: POST /api/orders
	// Apply AuthMiddleware directly to this route.
	router.POST("", middleware.AuthMiddleware(), handlers.CreateOrder)

	// Group for other user-specific order routes that have further path segments
	// e.g., /api/orders/user/:userID, /api/orders/:id
	// These routes will effectively be under /api/orders/ due to their path segments
	userOrderSpecificRoutes := router.Group("/") // This group is still effectively /api/orders base
	userOrderSpecificRoutes.Use(middleware.AuthMiddleware())
	{
		userOrderSpecificRoutes.GET("/user/:userID", handlers.GetOrdersByUserID) // Path: /api/orders/user/:userID
		userOrderSpecificRoutes.GET("/:id", handlers.GetOrderByID)               // Path: /api/orders/:id
	}

	// Admin routes for managing orders
	// e.g., /api/orders/:id/status
	adminOrderRoutes := router.Group("/") // This group is still effectively /api/orders base
	adminOrderRoutes.Use(middleware.AdminAuthMiddleware())
	{
		adminOrderRoutes.PUT("/:id/status", handlers.UpdateOrderStatus)       // Path: /api/orders/:id/status
		// adminOrderRoutes.GET("/", handlers.GetAllOrders) // If an admin needs to see all orders at /api/orders/ (use with care due to POST "" above)
	}
}
