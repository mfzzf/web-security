package handlers

import (
	"net/http"
	"strings"
	"time"
	"web-security/backend/utils"

	"github.com/gin-gonic/gin"
)

// LogoutHandler 处理用户注销 (旧LogoutUser函数的重命名版本)
func LogoutHandler(c *gin.Context) {
	// 从上下文中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未认证"})
		return
	}

	// 清除客户端Cookie
	c.SetCookie("access_token", "", -1, "/", "", true, true)
	c.SetCookie("refresh_token", "", -1, "/", "", true, true)

	// 获取认证令牌
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		// 如果没有认证头，我们可能正在使用Cookie认证
		// 仍然进行后续操作以使Redis中的令牌无效
	} else {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			tokenString := parts[1]

			// 将令牌加入黑名单
			// 解析令牌以获取过期时间
			claims, err := utils.ParseToken(tokenString)
			if err == nil && claims != nil && claims.ExpiresAt != nil {
				// 使用剩余的过期时间
				expiry := time.Until(claims.ExpiresAt.Time)
				if expiry > 0 {
					_ = utils.BlacklistToken(tokenString, expiry)
				} else {
					// 令牌已过期，使用短期黑名单时间
					_ = utils.BlacklistToken(tokenString, 1*time.Minute)
				}
			} else {
				// 解析失败，使用默认值
				_ = utils.BlacklistToken(tokenString, 15*time.Minute)
			}
		}
	}

	// 使该用户的所有令牌失效
	err := utils.InvalidateUserTokens(userID.(int))
	if err != nil {
		// 记录错误但继续流程
		// log.Printf("使令牌无效失败: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "注销成功"})
}
