package middleware

import (
	"net/http"
	"strings"
	"web-security/backend/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 验证请求中的JWT访问令牌
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从Authorization头获取令牌
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "需要认证令牌"})
			c.Abort()
			return
		}

		// 检查Authorization头的格式
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "认证令牌格式无效"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 检查令牌是否在黑名单中
		blacklisted, err := utils.IsTokenBlacklisted(tokenString)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "验证令牌时出错"})
			c.Abort()
			return
		}
		if blacklisted {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "令牌已被撤销"})
			c.Abort()
			return
		}

		// 验证访问令牌
		claims, err := utils.ValidateAccessToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的认证令牌: " + err.Error()})
			c.Abort()
			return
		}

		// 验证令牌是否在Redis中并且是最新的
		valid, err := utils.ValidateTokenInRedis(claims.UserID, tokenString, true)
		if err != nil || !valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "令牌已失效，请重新登录"})
			c.Abort()
			return
		}

		// 将用户信息设置到上下文中，以便后续的处理器使用
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// AdminAuthMiddleware 验证用户是否具有管理员角色
func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 先通过普通认证中间件
		AuthMiddleware()(c)
		if c.IsAborted() {
			return
		}

		// 检查用户角色
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户角色时出错"})
			c.Abort()
			return
		}

		// 验证用户是否为管理员
		if role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
			c.Abort()
			return
		}

		c.Next()
	}
}
