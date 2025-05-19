package routes

import (
	"web-security/backend/handlers"
	"web-security/backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupUserRoutes sets up the user-related routes
func SetupUserRoutes(router *gin.RouterGroup) {
	// 注意：主要认证路由已移至auth_routes.go
	// 这里保留向后兼容，不再推荐使用
	router.POST("/register", handlers.RegisterUserHandler)
	router.POST("/login", handlers.LoginUserHandler)

	// 受保护的路由 - 需要认证
	authGroup := router.Group("/")
	authGroup.Use(middleware.AuthMiddleware())
	{
		// 用户资料管理
		authGroup.GET("/profile", handlers.GetUserProfile)
		authGroup.PUT("/profile", handlers.UpdateUserProfile)

		// 用户偏好设置
		authGroup.GET("/preferences", handlers.GetUserPreferences)
		authGroup.PUT("/preferences", handlers.UpdateUserPreferences)
	}

	// 管理员路由 - 需要管理员权限
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AdminAuthMiddleware())
	{
		adminGroup.GET("/", handlers.ListAllUsers)
		adminGroup.GET("/:id", handlers.GetUserByID)
		adminGroup.PUT("/:id/status", handlers.UpdateUserStatus)
		adminGroup.DELETE("/:id", handlers.DeleteUser)
	}
}
