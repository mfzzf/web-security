package handlers

import (
	"database/sql"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"
	"web-security/backend/db"
	"web-security/backend/models"

	// "web-security/backend/redis_client" // For cart interactions later

	"github.com/gin-gonic/gin"
)

// CreateOrder handles the creation of a new order.
// This function should ideally run within a database transaction.
func CreateOrder(c *gin.Context) {
	var req models.OrderCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	// Generate a unique order number
	orderNumber := generateOrderNumber()

	// Get UserID from authenticated context for security
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Override request UserID with authenticated user ID for security
	req.UserID = userID.(int)

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction: " + err.Error()})
		return
	}
	// Defer a rollback in case of panic or error.
	// If Commit() is successful, the rollback will be a no-op.
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p) // re-throw panic after Rollback
		} else if err != nil {
			tx.Rollback() // err is non-nil; don't change it
		} else {
			err = tx.Commit() // if Commit returns error, it will be handled below
		}
	}()

	var totalAmount float64 = 0
	orderItemsForDB := []models.OrderItem{}

	// Process each item in the order
	for _, itemReq := range req.Items {
		var product models.Product
		// Check product existence and stock within the transaction
		err = tx.QueryRow("SELECT id, name, price, stock_quantity FROM products WHERE id = ? FOR UPDATE", itemReq.ProductID).Scan(
			&product.ID, &product.Name, &product.Price, &product.StockQuantity,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Product with ID " + strconv.Itoa(itemReq.ProductID) + " not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch product details: " + err.Error()})
			}
			return // This will trigger the deferred rollback
		}

		if product.StockQuantity < itemReq.Quantity {
			c.JSON(http.StatusConflict, gin.H{"error": "Not enough stock for product " + product.Name})
			return // This will trigger the deferred rollback
		}

		// Update stock
		newStock := product.StockQuantity - itemReq.Quantity
		_, err = tx.Exec("UPDATE products SET stock_quantity = ? WHERE id = ?", newStock, product.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock for product " + product.Name + ": " + err.Error()})
			return // This will trigger the deferred rollback
		}

		itemTotal := product.Price * float64(itemReq.Quantity)
		totalAmount += itemTotal
		orderItemsForDB = append(orderItemsForDB, models.OrderItem{
			ProductID:       product.ID,
			Quantity:        itemReq.Quantity,
			PriceAtPurchase: product.Price, // Store price at time of purchase
		})
	}

	// Create the order
	orderStmt, err := tx.Prepare("INSERT INTO orders(order_number, user_id, subtotal, tax, shipping_cost, discount_amount, total_amount, payment_method, payment_status, order_status, shipping_address) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare order statement: " + err.Error()})
		return
	}
	defer orderStmt.Close()

	orderStatus := "unpaid"        // Default status
	paymentStatus := "pending"     // Default payment status
	paymentMethod := "credit_card" // Default payment method

	// Set default values for new fields
	subtotal := totalAmount // Assuming no tax or shipping for simplicity
	tax := 0.0
	shippingCost := 0.0
	discountAmount := 0.0

	res, err := orderStmt.Exec(orderNumber, req.UserID, subtotal, tax, shippingCost, discountAmount, totalAmount, paymentMethod, paymentStatus, orderStatus, req.ShippingAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order: " + err.Error()})
		return
	}
	orderID, _ := res.LastInsertId()

	// Create order items
	orderItemStmt, err := tx.Prepare("INSERT INTO order_items(order_id, product_id, product_name, product_sku, quantity, unit_price, discount_amount, price_at_purchase, subtotal, item_status) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare order item statement: " + err.Error()})
		return
	}
	defer orderItemStmt.Close()

	for i := range orderItemsForDB {
		orderItemsForDB[i].OrderID = int(orderID) // Set the OrderID for each item

		// Get product name if needed
		var productName string
		var productSKU string
		var unitPrice float64
		var subtotal float64
		var discountAmount float64 = 0.0

		// Get the product details for this order item
		productRow := tx.QueryRow("SELECT name, sku, price FROM products WHERE id = ?", orderItemsForDB[i].ProductID)
		err = productRow.Scan(&productName, &productSKU, &unitPrice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product details: " + err.Error()})
			return
		}

		subtotal = orderItemsForDB[i].PriceAtPurchase * float64(orderItemsForDB[i].Quantity)

		_, err = orderItemStmt.Exec(
			orderID,
			orderItemsForDB[i].ProductID,
			productName,
			productSKU,
			orderItemsForDB[i].Quantity,
			unitPrice,
			discountAmount,
			orderItemsForDB[i].PriceAtPurchase,
			subtotal,
			"unpaid",
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order item: " + err.Error()})
			return
		}
	}

	// If we reach here, all operations were successful, try to commit.
	// The deferred function will handle the commit. If err is nil here, commit will be attempted.
	// If commit fails, the deferred function's `err = tx.Commit()` will capture it.

	if err != nil { // Check if commit failed
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	// Order created successfully, return the order ID and total amount

	c.JSON(http.StatusCreated, gin.H{"message": "Order created successfully", "order_id": orderID, "order_number": orderNumber, "total_amount": totalAmount})
}

// generateOrderNumber creates a unique order number in the format ORD-YYYYMMDDHHmmss-XXXX where XXXX is a random number
func generateOrderNumber() string {
	now := time.Now()
	timePart := now.Format("20060102150405")
	randomPart := rand.Intn(10000)
	return fmt.Sprintf("ORD-%s-%04d", timePart, randomPart)
}

// GetOrdersByUserID handles fetching all orders for a specific user.
func GetOrdersByUserID(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 扩展查询，包含更多字段
	query := `
        SELECT o.id, o.order_number, o.user_id, o.subtotal, o.shipping_cost, 
               o.discount_amount, o.total_amount, o.payment_method, o.order_status,
               o.shipping_address, o.payment_status, o.created_at,
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id, o.order_number, o.user_id, o.subtotal, o.shipping_cost, 
                 o.discount_amount, o.total_amount, o.payment_method, o.order_status,
                 o.shipping_address, o.payment_status, o.created_at
        ORDER BY o.created_at DESC
    `

	rows, err := db.DB.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders: " + err.Error()})
		return
	}
	defer rows.Close()

	// 创建用于响应的结构体切片
	responseOrders := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, userID                          int
			orderNumber, status, paymentMethod  string
			paymentStatus, shippingAddress      string
			totalAmount, subtotal, shippingCost float64
			discountAmount                      float64
			createdAt                           time.Time
			itemCount                           int
		)

		if err := rows.Scan(
			&id, &orderNumber, &userID, &subtotal, &shippingCost,
			&discountAmount, &totalAmount, &paymentMethod, &status,
			&shippingAddress, &paymentStatus, &createdAt, &itemCount,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order row: " + err.Error()})
			return
		}

		// 创建前端期望格式的订单对象
		order := map[string]interface{}{
			"id":              id,
			"orderNumber":     orderNumber,
			"userId":          userID,
			"status":          status,      // 从 order_status 重命名
			"totalAmount":     totalAmount, // 从 total_amount 重命名
			"shippingAddress": shippingAddress,
			"paymentMethod":   paymentMethod,
			"paymentStatus":   paymentStatus,
			"subtotal":        subtotal,
			"shippingCost":    shippingCost,
			"discountAmount":  discountAmount,
			"createdAt":       createdAt.Format(time.RFC3339), // 从 created_at 重命名
			"items":           []map[string]interface{}{},     // 初始化为空数组
		}

		// 获取该订单的前几个订单项（可选，如果性能有问题可以移除）
		itemsQuery := `
            SELECT oi.id, oi.product_id, oi.quantity, oi.price_at_purchase, p.name, p.image_main
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
            LIMIT 3
        `

		itemRows, err := db.DB.Query(itemsQuery, id)
		if err == nil {
			defer itemRows.Close()

			for itemRows.Next() {
				var itemID, productID, quantity int
				var price float64
				var productName string
				var imageMain sql.NullString

				if err := itemRows.Scan(&itemID, &productID, &quantity, &price, &productName, &imageMain); err == nil {
					item := map[string]interface{}{
						"id":        itemID,
						"productId": productID,
						"quantity":  quantity,
						"price":     price, // 从 price_at_purchase 重命名
						"product": map[string]interface{}{
							"id":   productID,
							"name": productName,
						},
					}

					if imageMain.Valid {
						// 修复图片URL：添加完整的静态文件URL前缀
						item["product"].(map[string]interface{})["imageUrl"] = "/product-images/" + imageMain.String
					}

					order["items"] = append(order["items"].([]map[string]interface{}), item)
				}
			}
		}

		responseOrders = append(responseOrders, order)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating order rows: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, responseOrders)
}

// GetOrderByID handles fetching a single order with its items.
// GetOrderByID handles fetching a single order with its items.
func GetOrderByID(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// Validate user ownership or admin access
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, roleExists := c.Get("role")
	if !roleExists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User role not found"})
		return
	}

	// Check if user is admin or owns the order
	// Safe type assertion with error handling
	role, ok := userRole.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role type"})
		return
	}

	if role != "admin" {
		// Verify order ownership for non-admin users
		var orderOwnerID int
		err = db.DB.QueryRow("SELECT user_id FROM orders WHERE id = ?", orderID).Scan(&orderOwnerID)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}

		if orderOwnerID != userID.(int) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: You can only view your own orders"})
			return
		}
	}

	// 查询订单详情，包含更多字段
	var (
		id, orderUserID                     int
		orderNumber, status, paymentMethod  string
		paymentStatus, shippingAddress      string
		totalAmount, subtotal, shippingCost float64
		discountAmount                      float64
		createdAt, updatedAt                time.Time
		trackingNumber                      sql.NullString
	)

	orderQuery := `
        SELECT id, order_number, user_id, subtotal, shipping_cost, 
               discount_amount, total_amount, payment_method, payment_status, 
               order_status, shipping_address, shipping_tracking, 
               created_at, updated_at
        FROM orders
        WHERE id = ?
    `

	err = db.DB.QueryRow(orderQuery, orderID).Scan(
		&id, &orderNumber, &orderUserID, &subtotal, &shippingCost,
		&discountAmount, &totalAmount, &paymentMethod, &paymentStatus,
		&status, &shippingAddress, &trackingNumber, &createdAt, &updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error fetching order: " + err.Error()})
		}
		return
	}

	// 创建前端期望格式的订单对象
	order := map[string]interface{}{
		"id":              id,
		"orderNumber":     orderNumber,
		"userId":          orderUserID,
		"status":          status,      // 从 order_status 重命名
		"totalAmount":     totalAmount, // 从 total_amount 重命名
		"shippingAddress": shippingAddress,
		"paymentMethod":   paymentMethod,
		"paymentStatus":   paymentStatus,
		"subtotal":        subtotal,
		"shippingCost":    shippingCost,
		"discountAmount":  discountAmount,
		"createdAt":       createdAt.Format(time.RFC3339), // 从 created_at 重命名
		"updatedAt":       updatedAt.Format(time.RFC3339), // 从 updated_at 重命名
		"items":           []map[string]interface{}{},     // 将被填充
	}

	if trackingNumber.Valid {
		order["trackingNumber"] = trackingNumber.String
	}

	// 解析地址字符串为结构化对象
	addressParts := parseShippingAddress(shippingAddress)
	order["shippingAddress"] = addressParts

	// 查询订单项并关联产品信息
	itemsQuery := `
        SELECT oi.id, oi.product_id, oi.quantity, oi.price_at_purchase, 
               p.name, p.description, p.image_main
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `

	itemRows, err := db.DB.Query(itemsQuery, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order items: " + err.Error()})
		return
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var itemID, productID, quantity int
		var price float64
		var productName, productDesc string
		var imageMain sql.NullString

		if err := itemRows.Scan(&itemID, &productID, &quantity, &price, &productName, &productDesc, &imageMain); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order item row: " + err.Error()})
			return
		}

		item := map[string]interface{}{
			"id":        itemID,
			"productId": productID,
			"quantity":  quantity,
			"price":     price, // 从 price_at_purchase 重命名
			"product": map[string]interface{}{
				"id":          productID,
				"name":        productName,
				"description": productDesc,
			},
		}

		if imageMain.Valid {
			// 修复图片URL：添加完整的静态文件URL前缀
			item["product"].(map[string]interface{})["imageUrl"] = "/product-images/" + imageMain.String
		}

		order["items"] = append(order["items"].([]map[string]interface{}), item)
	}

	if err = itemRows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating order item rows: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, order)
}

// 解析地址字符串为结构化对象的辅助函数
func parseShippingAddress(addressStr string) map[string]interface{} {
	// 简单的地址解析，您可能需要根据实际格式调整
	addressParts := map[string]interface{}{
		"address": addressStr,
	}

	// 如果地址格式是 "Street, City, State ZIP"，可以尝试解析
	parts := strings.Split(addressStr, ",")

	if len(parts) >= 3 {
		addressParts["address"] = strings.TrimSpace(parts[0])
		addressParts["city"] = strings.TrimSpace(parts[1])

		// 处理 "State ZIP"
		stateZip := strings.TrimSpace(parts[2])
		stateZipParts := strings.Fields(stateZip)

		if len(stateZipParts) >= 2 {
			addressParts["state"] = stateZipParts[0]
			addressParts["zipCode"] = stateZipParts[1]
		} else if len(stateZipParts) == 1 {
			addressParts["state"] = stateZipParts[0]
		}
	}

	return addressParts
}

// UpdateOrderStatus handles updating the status of an order (e.g., by an admin).
func UpdateOrderStatus(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.OrderUpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	// Validate user permissions for status updates
	userRole, roleExists := c.Get("role")
	if !roleExists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User role not found"})
		return
	}

	// Safe type assertion with error handling
	role, ok := userRole.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role type"})
		return
	}

	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only administrators can update order status"})
		return
	}

	// Validate status transitions
	validStatuses := map[string]bool{
		"pending":    true,
		"confirmed":  true,
		"processing": true,
		"shipped":    true,
		"delivered":  true,
		"cancelled":  true,
		"refunded":   true,
	}

	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Valid statuses are: pending, confirmed, processing, shipped, delivered, cancelled, refunded"})
		return
	}

	// Get current order status to validate transition
	var currentStatus string
	err = db.DB.QueryRow("SELECT order_status FROM orders WHERE id = ?", orderID).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	// Validate status transition logic
	if !isValidStatusTransition(currentStatus, req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid status transition from %s to %s", currentStatus, req.Status)})
		return
	}

	stmt, err := db.DB.Prepare("UPDATE orders SET order_status = ? WHERE id = ?")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare status update: " + err.Error()})
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(req.Status, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status: " + err.Error()})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found or status unchanged"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully", "order_id": orderID, "new_status": req.Status})
}

// isValidStatusTransition validates whether a status transition is allowed
func isValidStatusTransition(currentStatus, newStatus string) bool {
	// Define valid status transitions
	validTransitions := map[string][]string{
		"pending":    {"confirmed", "cancelled"},
		"confirmed":  {"processing", "cancelled"},
		"processing": {"shipped", "cancelled"},
		"shipped":    {"delivered", "cancelled"},
		"delivered":  {"refunded"},
		"cancelled":  {},                       // No transitions from cancelled
		"refunded":   {},                       // No transitions from refunded
		"unpaid":     {"pending", "cancelled"}, // Allow unpaid to pending or cancelled
	}

	// Allow same status (no change)
	if currentStatus == newStatus {
		return true
	}

	// Check if transition is valid
	allowedTransitions, exists := validTransitions[currentStatus]
	if !exists {
		return false
	}

	for _, allowedStatus := range allowedTransitions {
		if allowedStatus == newStatus {
			return true
		}
	}

	return false
}
