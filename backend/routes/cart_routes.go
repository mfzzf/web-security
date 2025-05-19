package routes

import (
	"web-security/backend/handlers"
	"web-security/backend/middleware"

	"github.com/gin-gonic/gin"
)

// SetupCartRoutes 设置购物车相关路由
func SetupCartRoutes(router *gin.RouterGroup) {
	// 所有购物车路由都需要认证
	cartRoutes := router.Group("")
	cartRoutes.Use(middleware.AuthMiddleware())
	{
		// 获取购物车
		cartRoutes.GET("", handlers.GetCart)
		
		// 添加商品到购物车
		cartRoutes.POST("", handlers.AddToCart)
		
		// 更新购物车商品数量
		cartRoutes.PUT("/:id", handlers.UpdateCartItem)
		
		// 删除购物车商品
		cartRoutes.DELETE("/:id", handlers.RemoveFromCart)
		
		// 清空购物车
		cartRoutes.DELETE("", handlers.ClearCart)
	}
}
