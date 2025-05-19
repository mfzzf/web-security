package routes

import (
	"web-security/backend/handlers"
	// "web-security/backend/middleware" // For admin auth middleware later

	"github.com/gin-gonic/gin"
)

// SetupProductRoutes sets up the product-related routes
func SetupProductRoutes(router *gin.RouterGroup) {
	// Public routes for viewing products
	router.GET("", handlers.GetProducts)    // Changed from "/" to "" to match without trailing slash
	router.GET("/:id", handlers.GetProductByID)

	// Admin/Protected routes for managing products
	// adminGroup := router.Group("")  // Changed from "/" to ""
	// adminGroup.Use(middleware.AdminAuthMiddleware()) // Placeholder for admin auth
	// {
	//  adminGroup.POST("", handlers.CreateProduct)  // Changed from "/" to ""
	//  adminGroup.PUT("/:id", handlers.UpdateProduct)
	//  adminGroup.DELETE("/:id", handlers.DeleteProduct)
	// }

	// For now, without specific admin middleware for simplicity of initial setup
	router.POST("", handlers.CreateProduct)  // Changed from "/" to "" to match without trailing slash
	router.PUT("/:id", handlers.UpdateProduct)
	router.DELETE("/:id", handlers.DeleteProduct)
}
