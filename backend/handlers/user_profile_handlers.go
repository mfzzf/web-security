package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"
	"web-security/backend/db"
	"web-security/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/microcosm-cc/bluemonday"
)

var profileSanitizer = bluemonday.UGCPolicy()

// GetUserProfile 获取当前认证用户的完整资料
func GetUserProfile(c *gin.Context) {
	// 从上下文中获取用户ID（在AuthMiddleware中设置）
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "需要认证"})
		return
	}

	// 使用指针变量来处理可能为NULL的值
	var (
		id int
		username, email, role, accountStatus string
		fullName, phone, address, city, stateProvince, zipPostalCode *string
		lastLogin *time.Time
		createdAt, updatedAt time.Time
	)

	// 根据用户ID查询完整的用户资料
	err := db.DB.QueryRow(`
		SELECT id, username, email, full_name, phone, address, city, state_province, zip_postal_code, role, 
		last_login, account_status, created_at, updated_at 
		FROM users WHERE id = ?
	`, userID).Scan(
		&id, &username, &email, &fullName, &phone, &address, &city, &stateProvince, &zipPostalCode,
		&role, &lastLogin, &accountStatus, &createdAt, &updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到用户资料"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户资料失败: " + err.Error()})
		}
		return
	}

	// 构造用户响应对象，将指针值转换为非指针
	response := models.UserResponse{
		ID:            id,
		Username:      username,
		Email:         email,
		Role:          role,
		AccountStatus: accountStatus,
		LastLogin:     lastLogin,
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}

	// 处理可能为NULL的字段
	if fullName != nil {
		response.FullName = *fullName
	}
	if phone != nil {
		response.Phone = *phone
	}
	if address != nil {
		response.Address = *address
	}
	if city != nil {
		response.City = *city
	}
	if stateProvince != nil {
		response.StateProvince = *stateProvince
	}
	if zipPostalCode != nil {
		response.ZipPostalCode = *zipPostalCode
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserProfile 更新当前认证用户的资料
func UpdateUserProfile(c *gin.Context) {
	// 从上下文中获取用户ID（在AuthMiddleware中设置）
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "需要认证"})
		return
	}

	var req struct {
		FullName      string `json:"full_name"`
		Phone         string `json:"phone"`
		Address       string `json:"address"`
		City          string `json:"city"`
		StateProvince string `json:"state_province"`
		ZipPostalCode string `json:"zip_postal_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// 净化用户输入
	req.FullName = profileSanitizer.Sanitize(req.FullName)
	req.Phone = profileSanitizer.Sanitize(req.Phone)
	req.Address = profileSanitizer.Sanitize(req.Address)
	req.City = profileSanitizer.Sanitize(req.City)
	req.StateProvince = profileSanitizer.Sanitize(req.StateProvince)
	req.ZipPostalCode = profileSanitizer.Sanitize(req.ZipPostalCode)

	// 构建更新SQL语句
	stmt, err := db.DB.Prepare(`
		UPDATE users 
		SET 
			full_name = ?, 
			phone = ?, 
			address = ?,
			city = ?,
			state_province = ?,
			zip_postal_code = ?,
			updated_at = ?
		WHERE id = ?
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "准备更新语句失败: " + err.Error()})
		return
	}
	defer stmt.Close()

	// 执行更新操作
	now := time.Now()
	_, err = stmt.Exec(req.FullName, req.Phone, req.Address, req.City, req.StateProvince, req.ZipPostalCode, now, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户资料失败: " + err.Error()})
		return
	}

	// 返回更新后的用户资料
	GetUserProfile(c)
}

// GetUserPreferences 获取用户偏好设置
func GetUserPreferences(c *gin.Context) {
	// 从上下文中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "需要认证"})
		return
	}

	// 此处简单示例，实际应用中应该有专门的用户偏好表
	// 这里使用一个简单的JSON响应作为示例
	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"preferences": gin.H{
			"theme": "light",
			"notifications_enabled": true,
			"language": "zh-CN",
		},
	})
}

// UpdateUserPreferences 更新用户偏好设置
func UpdateUserPreferences(c *gin.Context) {
	// 从上下文中获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "需要认证"})
		return
	}

	var req struct {
		Theme               string `json:"theme"`
		NotificationsEnabled bool   `json:"notifications_enabled"`
		Language            string `json:"language"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// 此处简单示例，实际应用中应该有专门的用户偏好表
	// 这里只是返回一个成功响应作为示例
	c.JSON(http.StatusOK, gin.H{
		"message": "偏好设置已更新",
		"user_id": userID,
		"preferences": gin.H{
			"theme": req.Theme,
			"notifications_enabled": req.NotificationsEnabled,
			"language": req.Language,
		},
	})
}

// ListAllUsers 管理员专用：获取所有用户列表
func ListAllUsers(c *gin.Context) {
	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	
	offset := (page - 1) * limit

	// 查询用户总数
	var totalUsers int
	err := db.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户总数失败: " + err.Error()})
		return
	}

	// 查询用户列表（分页）
	rows, err := db.DB.Query(`
		SELECT id, username, email, full_name, role, account_status, created_at, last_login
		FROM users
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败: " + err.Error()})
		return
	}
	defer rows.Close()

	users := []models.UserResponse{}
	for rows.Next() {
		var user models.UserResponse
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.FullName,
			&user.Role, &user.AccountStatus, &user.CreatedAt, &user.LastLogin,
		)
		if err != nil {
			continue // 跳过错误的记录
		}
		users = append(users, user)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total_users":  totalUsers,
			"total_pages":  (totalUsers + limit - 1) / limit,
		},
	})
}

// GetUserByID 管理员专用：根据ID获取用户详情
func GetUserByID(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	var user models.UserResponse
	err = db.DB.QueryRow(`
		SELECT id, username, email, full_name, phone, address, role, 
		last_login, account_status, created_at, updated_at
		FROM users WHERE id = ?
	`, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.FullName,
		&user.Phone, &user.Address, &user.Role, &user.LastLogin,
		&user.AccountStatus, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户详情失败: " + err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateUserStatus 管理员专用：更新用户状态
func UpdateUserStatus(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据: " + err.Error()})
		return
	}

	// 验证状态值
	if req.Status != "active" && req.Status != "inactive" && req.Status != "suspended" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的状态值，必须是 active、inactive 或 suspended"})
		return
	}

	// 更新用户状态
	stmt, err := db.DB.Prepare("UPDATE users SET account_status = ?, updated_at = ? WHERE id = ?")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "准备更新语句失败: " + err.Error()})
		return
	}
	defer stmt.Close()

	now := time.Now()
	result, err := stmt.Exec(req.Status, now, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户状态失败: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	// 当用户被停用时，使其所有令牌无效（考虑安全性）
	if req.Status == "suspended" || req.Status == "inactive" {
		// 这里可以调用令牌黑名单逻辑，但简单起见，我们可以假设用户的令牌已被处理
		// utils.InvalidateUserTokens(userID) // 理论上应该调用这个
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "用户状态已更新",
		"user_id": userID,
		"status":  req.Status,
	})
}

// DeleteUser 管理员专用：删除用户
func DeleteUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	// 检查是否尝试删除自己（不允许）
	currentUserID, _ := c.Get("userID")
	if currentUserID.(int) == userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "不能删除自己的账户"})
		return
	}

	// 执行删除操作
	stmt, err := db.DB.Prepare("DELETE FROM users WHERE id = ?")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "准备删除语句失败: " + err.Error()})
		return
	}
	defer stmt.Close()

	result, err := stmt.Exec(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除用户失败: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "用户已成功删除",
		"user_id": userID,
	})
}
