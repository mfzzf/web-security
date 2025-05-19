package handlers

import (
	"database/sql"
	"net/http"
	"strings"
	"time"
	"web-security/backend/db"
	"web-security/backend/models"
	"web-security/backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/microcosm-cc/bluemonday"
	"golang.org/x/crypto/bcrypt"
)

var authSanitizer = bluemonday.UGCPolicy()

// RegisterUserHandler handles new user registration
func RegisterUserHandler(c *gin.Context) {
	var req models.UserRegister
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// XSS保护，净化用户输入
	req.Username = authSanitizer.Sanitize(req.Username)
	req.Email = authSanitizer.Sanitize(req.Email)

	// 检查用户名或邮箱是否已存在
	var existingUser models.User
	err := db.DB.QueryRow("SELECT id FROM users WHERE username = ? OR email = ?", req.Username, req.Email).Scan(&existingUser.ID)
	if err == nil { // 如果err为nil，则找到了用户
		c.JSON(http.StatusConflict, gin.H{"error": "用户名或邮箱已存在"})
		return
	}
	// 如果不是没找到行的错误，则是服务器错误
	if err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询错误: " + err.Error()})
		return
	}

	// 哈希密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码哈希失败"})
		return
	}

	// 默认用户角色为"user"
	role := "user"

	// 执行插入操作
	stmt, err := db.DB.Prepare("INSERT INTO users(username, email, password_hash, role, account_status, created_at) VALUES(?, ?, ?, ?, ?, ?)")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "准备SQL语句失败: " + err.Error()})
		return
	}
	defer stmt.Close()

	now := time.Now()
	res, err := stmt.Exec(req.Username, req.Email, hashedPassword, role, "active", now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册用户失败: " + err.Error()})
		return
	}

	// 获取新插入的用户ID
	userID, _ := res.LastInsertId()

	// 创建响应对象，不包含敏感信息
	newUser := models.User{
		ID:        int(userID),
		Username:  req.Username,
		Email:     req.Email,
		Role:      role,
		CreatedAt: now,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "用户注册成功",
		"user":    newUser,
	})
}

// LoginUserHandler handles user login
func LoginUserHandler(c *gin.Context) {
	var req models.UserLogin
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// XSS保护，净化用户输入
	req.Username = authSanitizer.Sanitize(req.Username)

	var user models.User
	// 查询用户信息
	err := db.DB.QueryRow(`
		SELECT id, username, password_hash, email, role, account_status, last_login, created_at, updated_at 
		FROM users WHERE username = ?
	`, req.Username).Scan(
		&user.ID, &user.Username, &user.PasswordHash, &user.Email, 
		&user.Role, &user.AccountStatus, &user.LastLogin, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// 用户不存在，返回通用错误信息，避免暴露哪个字段有误
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码不正确"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询错误: " + err.Error()})
		}
		return
	}

	// 检查账户状态
	if user.AccountStatus != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "账户已被禁用，请联系管理员"})
		return
	}

	// 验证密码
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码不正确"})
		return
	}

	// 生成JWT令牌对
	accessToken, refreshToken, err := utils.GenerateJWTPair(user.ID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败: " + err.Error()})
		return
	}

	// 存储令牌到Redis
	err = utils.StoreAccessToken(user.ID, accessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "存储令牌失败: " + err.Error()})
		return
	}

	err = utils.StoreRefreshToken(user.ID, refreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "存储刷新令牌失败: " + err.Error()})
		return
	}

	// 更新用户最后登录时间
	_, err = db.DB.Exec("UPDATE users SET last_login = ? WHERE id = ?", time.Now(), user.ID)
	if err != nil {
		// 非关键错误，可以继续流程
		// log.Printf("更新用户最后登录时间失败: %v", err)
	}

	// 设置Cookie - 访问令牌 (在开发环境中禁用Secure标志)
	c.SetCookie(
		"access_token",
		accessToken,
		int(utils.AccessTokenExpiry.Seconds()),
		"/",
		"", // 域名留空表示仅用于当前域名
		false, // 在开发环境中设为false，生产环境应设为true
		false, // HttpOnly设为false，允许前端JavaScript访问
	)

	// 设置Cookie - 刷新令牌
	c.SetCookie(
		"refresh_token",
		refreshToken,
		int(utils.RefreshTokenExpiry.Seconds()),
		"/",
		"", // 域名留空表示仅用于当前域名
		false, // 在开发环境中设为false，生产环境应设为true
		false, // HttpOnly设为false，允许前端JavaScript访问
	)

	// 将令牌返回给客户端
	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

// LogoutUser 处理用户注销
func LogoutUser(c *gin.Context) {
	// 从上下文中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未认证"})
		return
	}

	// 获取认证令牌
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少认证令牌"})
		return
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "认证令牌格式无效"})
		return
	}
	tokenString := parts[1]

	// 解析令牌以获取过期时间
	claims, err := utils.ParseToken(tokenString)
	if err != nil {
		// 即使令牌无效，也继续注销过程
		// log.Printf("解析令牌失败: %v", err)
	}

	// 获取过期时间，如果解析失败则使用默认值
	expiry := 15 * time.Minute // 默认过期时间
	if claims != nil && claims.ExpiresAt != nil {
		expiry = time.Until(claims.ExpiresAt.Time)
		if expiry < 0 {
			expiry = 1 * time.Minute // 如果令牌已过期，则设置一个较短的黑名单时间
		}
	}

	// 将令牌加入黑名单
	if err := utils.BlacklistToken(tokenString, expiry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注销失败: " + err.Error()})
		return
	}

	// 使该用户的所有令牌失效
	if err := utils.InvalidateUserTokens(userID.(int)); err != nil {
		// 记录错误，但仍然继续注销过程
		// log.Printf("使令牌失效失败: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "注销成功"})
}

// RefreshToken 处理令牌刷新
func RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// 检查令牌是否在黑名单中
	blacklisted, err := utils.IsTokenBlacklisted(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "验证令牌时出错"})
		return
	}
	if blacklisted {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "刷新令牌已被撤销"})
		return
	}

	// 验证刷新令牌
	claims, err := utils.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的刷新令牌: " + err.Error()})
		return
	}

	// 检查刷新令牌是否在Redis中并且是最新的
	valid, err := utils.ValidateTokenInRedis(claims.UserID, req.RefreshToken, false)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "刷新令牌已失效，请重新登录"})
		return
	}

	// 检查用户状态
	var user models.User
	err = db.DB.QueryRow("SELECT username, role, account_status FROM users WHERE id = ?", claims.UserID).Scan(
		&user.Username, &user.Role, &user.AccountStatus,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败: " + err.Error()})
		return
	}

	if user.AccountStatus != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "账户已被禁用，请联系管理员"})
		return
	}

	// 生成新的JWT令牌对
	newAccessToken, newRefreshToken, err := utils.GenerateJWTPair(claims.UserID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成新令牌失败: " + err.Error()})
		return
	}

	// 将旧的刷新令牌加入黑名单
	if err := utils.BlacklistToken(req.RefreshToken, time.Hour*24*7); err != nil {
		// log.Printf("将旧令牌加入黑名单失败: %v", err)
	}

	// 存储新令牌
	if err := utils.StoreAccessToken(claims.UserID, newAccessToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "存储新访问令牌失败: " + err.Error()})
		return
	}
	if err := utils.StoreRefreshToken(claims.UserID, newRefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "存储新刷新令牌失败: " + err.Error()})
		return
	}

	// 在刷新令牌响应中设置Cookie (开发环境配置)
	c.SetCookie(
		"access_token", 
		newAccessToken, 
		int(utils.AccessTokenExpiry.Seconds()), 
		"/", 
		"", // 域名留空表示仅用于当前域名
		false, // 在开发环境中设为false，生产环境应设为true
		false, // HttpOnly设为false，允许前端JavaScript访问
	)

	c.SetCookie(
		"refresh_token", 
		newRefreshToken, 
		int(utils.RefreshTokenExpiry.Seconds()),
		"/", 
		"", // 域名留空表示仅用于当前域名
		false, // 在开发环境中设为false，生产环境应设为true
		false, // HttpOnly设为false，允许前端JavaScript访问
	)

	// 返回令牌和用户信息，保持与登录响应格式一致
	c.JSON(http.StatusOK, gin.H{
		"access_token":  newAccessToken,
		"refresh_token": newRefreshToken,
		"user": gin.H{
			"id":       claims.UserID,
			"username": user.Username,
			"email":    "", // 由于这里没有查询用户邮箱，暂时保留空字符串
			"role":     user.Role,
		},
	})
}
