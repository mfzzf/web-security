package routes

import (
	"web-security/backend/handlers"
	// "web-security/backend/middleware" // For admin auth middleware later

	"github.com/gin-gonic/gin"
)

// SetupCategoryRoutes sets up the category-related routes
func SetupCategoryRoutes(router *gin.RouterGroup) {
	// Public routes for viewing categories
	router.GET("/", handlers.GetCategories)
	router.GET("/:id", handlers.GetCategoryByID)

	// Admin/Protected routes for managing categories
	// adminGroup := router.Group("/")
	// adminGroup.Use(middleware.AdminAuthMiddleware()) // Placeholder for admin auth
	// {
	//  adminGroup.POST("/", handlers.CreateCategory)
	//  adminGroup.PUT("/:id", handlers.UpdateCategory)
	//  adminGroup.DELETE("/:id", handlers.DeleteCategory)
	// }

	// For now, without specific admin middleware
	router.POST("/", handlers.CreateCategory)
	router.PUT("/:id", handlers.UpdateCategory)
	router.DELETE("/:id", handlers.DeleteCategory)
}
