package routes

import (
	"web-security/backend/handlers"
	"web-security/backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes 设置与认证相关的路由
func SetupAuthRoutes(router *gin.RouterGroup) {
	// 公共路由（不需要认证）
	router.POST("/register", handlers.RegisterUserHandler) // 用户注册
	router.POST("/login", handlers.LoginUserHandler)      // 用户登录
	router.POST("/refresh", handlers.RefreshToken)        // 刷新令牌

	// 需要认证的路由
	protected := router.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.POST("/logout", handlers.LogoutHandler) // 用户注销
	}
}
