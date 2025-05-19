package handlers

import (
	"github.com/gin-gonic/gin"
)

// 注意：RegisterUser 已移至 auth_handlers.go
// 这是为了向后兼容，避免现有路由中断
func RegisterUser(c *gin.Context) {
	// 直接调用新的 auth_handlers.go 中的实现
	RegisterUserHandler(c)
}

// 注意：LoginUser 已移至 auth_handlers.go
// 这是为了向后兼容，避免现有路由中断
func LoginUser(c *gin.Context) {
	// 直接调用新的 auth_handlers.go 中的实现
	LoginUserHandler(c)
}
