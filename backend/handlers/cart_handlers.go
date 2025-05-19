package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"
	"web-security/backend/db"
	"web-security/backend/models"

	"github.com/gin-gonic/gin"
)

// GetCart 获取用户的购物车并计算最新价格
func GetCart(c *gin.Context) {
	// 从认证中间件获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 查询用户的购物车项
	rows, err := db.DB.Query(`
		SELECT ci.id, ci.product_id, ci.quantity, 
		       p.name, p.price, p.image_main
		FROM cart_items ci
		JOIN products p ON ci.product_id = p.id
		WHERE ci.user_id = ?
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart items: " + err.Error()})
		return
	}
	defer rows.Close()

	var cartItems []models.CartItemResponse
	var totalQuantity int
	var totalAmount float64

	for rows.Next() {
		var item models.CartItemResponse
		var imageMain sql.NullString
		
		if err := rows.Scan(&item.ID, &item.ProductID, &item.Quantity, 
			&item.Name, &item.Price, &imageMain); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan cart item: " + err.Error()})
			return
		}
		
		// 计算单个商品的总价
		item.TotalPrice = item.Price * float64(item.Quantity)
		
		// 设置图片URL
		if imageMain.Valid {
			item.ImageUrl = "/product-images/" + imageMain.String
		}
		
		// 添加到商品列表
		cartItems = append(cartItems, item)
		
		// 更新总计
		totalQuantity += item.Quantity
		totalAmount += item.TotalPrice
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating cart items: " + err.Error()})
		return
	}

	// 返回完整的购物车摘要信息
	c.JSON(http.StatusOK, models.CartSummary{
		Items:         cartItems,
		TotalQuantity: totalQuantity,
		TotalAmount:   totalAmount,
	})
}

// AddToCart 添加商品到购物车
func AddToCart(c *gin.Context) {
	// 从认证中间件获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// 检查产品是否存在
	var productExists bool
	err := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE id = ?)", req.ProductID).Scan(&productExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product existence: " + err.Error()})
		return
	}
	if !productExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 检查购物车中是否已有该商品
	var existingCartItemID int
	var existingQuantity int
	err = db.DB.QueryRow("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?", 
		userID, req.ProductID).Scan(&existingCartItemID, &existingQuantity)
	
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing cart item: " + err.Error()})
		return
	}

	now := time.Now()
	
	if err == sql.ErrNoRows {
		// 添加新的购物车项
		_, err = db.DB.Exec(
			"INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			userID, req.ProductID, req.Quantity, now, now,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add item to cart: " + err.Error()})
			return
		}
	} else {
		// 更新现有购物车项的数量
		newQuantity := existingQuantity + req.Quantity
		_, err = db.DB.Exec(
			"UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?",
			newQuantity, now, existingCartItemID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item quantity: " + err.Error()})
			return
		}
	}

	// 添加完成后，重新获取整个购物车并返回
	GetCart(c)
}

// UpdateCartItem 更新购物车项的数量
func UpdateCartItem(c *gin.Context) {
	// 从认证中间件获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 获取请求的购物车项ID
	cartItemID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cart item ID"})
		return
	}

	var req struct {
		Quantity int `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// 验证购物车项属于当前用户
	var belongs bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM cart_items WHERE id = ? AND user_id = ?)", 
		cartItemID, userID).Scan(&belongs)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify cart item ownership: " + err.Error()})
		return
	}
	
	if !belongs {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this cart item"})
		return
	}

	// 更新购物车项数量
	_, err = db.DB.Exec(
		"UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?",
		req.Quantity, time.Now(), cartItemID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item: " + err.Error()})
		return
	}

	// 更新完成后，重新获取整个购物车并返回
	GetCart(c)
}

// RemoveFromCart 从购物车中删除商品
func RemoveFromCart(c *gin.Context) {
	// 从认证中间件获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 获取请求的购物车项ID
	cartItemID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cart item ID"})
		return
	}

	// 验证购物车项属于当前用户
	var belongs bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM cart_items WHERE id = ? AND user_id = ?)", 
		cartItemID, userID).Scan(&belongs)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify cart item ownership: " + err.Error()})
		return
	}
	
	if !belongs {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to remove this cart item"})
		return
	}

	// 删除购物车项
	_, err = db.DB.Exec("DELETE FROM cart_items WHERE id = ?", cartItemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove cart item: " + err.Error()})
		return
	}

	// 删除完成后，重新获取整个购物车并返回
	GetCart(c)
}

// ClearCart 清空用户的购物车
func ClearCart(c *gin.Context) {
	// 从认证中间件获取用户ID
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// 删除用户的所有购物车项
	_, err := db.DB.Exec("DELETE FROM cart_items WHERE user_id = ?", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear cart: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cart cleared successfully",
		"items": []models.CartItemResponse{},
		"totalQuantity": 0,
		"totalAmount": 0,
	})
}
