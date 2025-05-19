package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"
	"web-security/backend/db"
	"web-security/backend/models"
	"web-security/backend/payment"

	"github.com/gin-gonic/gin"
)

// PaymentProcessor is the global payment processor instance
var PaymentProcessor *payment.StripeProcessor

// InitPaymentProcessor initializes the payment processor with the API key
func InitPaymentProcessor(apiKey, frontendURL string) {
	PaymentProcessor = payment.NewStripeProcessor(apiKey, frontendURL)
}

// CreatePaymentSession creates a new payment session for an order
func CreatePaymentSession(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// Fetch the order from the database
	var order models.Order
	err = db.DB.QueryRow("SELECT id, user_id, total_amount, order_status, shipping_address, created_at, updated_at FROM orders WHERE id = ?", orderID).Scan(
		&order.ID, &order.UserID, &order.TotalAmount, &order.Status, &order.ShippingAddress, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error fetching order: " + err.Error()})
		}
		return
	}

	// Only allow payment creation for orders in 'unpaid' status
	if order.Status != "unpaid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot create payment for order with status: " + order.Status})
		return
	}

	// Fetch order items for payment processing
	itemRows, err := db.DB.Query(`
		SELECT oi.product_id, p.name, p.price, oi.quantity, oi.price_at_purchase 
		FROM order_items oi 
		JOIN products p ON oi.product_id = p.id 
		WHERE oi.order_id = ?`, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order items: " + err.Error()})
		return
	}
	defer itemRows.Close()

	// Build the order items for payment processing
	var paymentItems []payment.OrderItem
	for itemRows.Next() {
		var item payment.OrderItem
		if err := itemRows.Scan(&item.ProductID, &item.Name, &item.Price, &item.Quantity, &item.PriceAtPurchase); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan order item row: " + err.Error()})
			return
		}
		paymentItems = append(paymentItems, item)
	}
	if err = itemRows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating order item rows: " + err.Error()})
		return
	}

	// Create the payment order object
	paymentOrder := &payment.Order{
		ID:          order.ID,
		UserID:      order.UserID,
		TotalAmount: order.TotalAmount,
		Status:      order.Status,
		Items:       paymentItems,
	}

	// Create payment session with Stripe
	paymentURL, sessionID, err := PaymentProcessor.CreatePaymentSession(c.Request.Context(), paymentOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment session: " + err.Error()})
		return
	}

	// Update the order with payment information
	_, err = db.DB.Exec("UPDATE orders SET payment_intent_id = ?, payment_link = ? WHERE id = ?", 
		sessionID, paymentURL, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order payment info: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_url": paymentURL,
		"session_id":  sessionID,
		"order_id":    orderID,
	})
}

// HandlePaymentSuccess handles the webhook or callback from Stripe for successful payments
func HandlePaymentSuccess(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID is required"})
		return
	}

	// Verify the payment status with Stripe - 获取详细的支付结果
	paymentResult, err := PaymentProcessor.VerifyPaymentSession(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify payment: " + err.Error()})
		return
	}

	// 检查支付状态
	if paymentResult.Status != "paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment is not complete. Current status: " + paymentResult.Status})
		return
	}

	// 查找订单 - 首先尝试通过payment_intent_id查找
	var orderID int
	var tx *sql.Tx
	var dbErr error
	
	tx, dbErr = db.DB.Begin()
	if dbErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction: " + dbErr.Error()})
		return
	}
	
	// 设置事务回滚
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 首先尝试使用Session ID查找订单
	err = tx.QueryRow("SELECT id FROM orders WHERE payment_intent_id = ?", sessionID).Scan(&orderID)
	if err != nil {
		// 如果找不到，尝试使用支付意图ID查找
		if err == sql.ErrNoRows && paymentResult.TransactionID != "" {
			err = tx.QueryRow("SELECT id FROM orders WHERE payment_intent_id = ?", paymentResult.TransactionID).Scan(&orderID)
		}
		
		// 如果还是找不到，尝试从URL查询参数中获取订单ID
		if err == sql.ErrNoRows {
			orderIDStr := c.Query("orderID")
			if orderIDStr != "" {
				if orderID, err = strconv.Atoi(orderIDStr); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID in query parameter"})
					return
				}
			} else {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found for this payment"})
				return
			}
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error finding order: " + err.Error()})
			return
		}
	}

	// 计算支付金额（从分转换为元）
	paymentAmount := float64(paymentResult.Amount) / 100.0

	// 将支付方式转换为用户友好的格式
	paymentMethodDisplay := paymentResult.PaymentMethod
	if paymentMethodDisplay == "" {
		paymentMethodDisplay = "card" // 默认为信用卡
	}

	// 更新订单状态和支付信息
	_, err = tx.Exec(`
		UPDATE orders 
		SET order_status = ?, 
		    payment_status = ?, 
		    payment_method = ?,
		    payment_intent_id = ?,
		    updated_at = ? 
		WHERE id = ?
	`, 
		"paid&processing", // 订单状态
		"completed", // 支付状态
		paymentMethodDisplay, // 支付方式
		paymentResult.TransactionID, // 交易ID 
		time.Now(), // 更新时间
		orderID, // 订单ID
	)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status: " + err.Error()})
		return
	}

	// 提交事务
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return 
	}

	// 返回成功信息，包含更多支付详情
	c.JSON(http.StatusOK, gin.H{
		"message":        "Payment successful",
		"order_id":       orderID,
		"status":         "paid",
		"payment_amount": paymentAmount,
		"payment_method": paymentMethodDisplay,
		"transaction_id": paymentResult.TransactionID,
		"payment_time":   paymentResult.PaymentTime,
	})
}

// HandlePaymentCancel handles payment cancellation
func HandlePaymentCancel(c *gin.Context) {
	orderID := c.Query("orderID")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Payment was cancelled",
		"order_id": orderID,
	})
}

// CheckPaymentStatus checks the current payment status of an order
func CheckPaymentStatus(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// 获取订单的支付信息
	var sessionID, paymentLink, orderStatus, paymentStatus, paymentMethod string
	var orderAmount float64
	var createdAt, updatedAt time.Time
	
	err = db.DB.QueryRow(`
		SELECT 
			payment_intent_id, 
			payment_link, 
			order_status, 
			payment_status,
			payment_method,
			total_amount,
			created_at,
			updated_at
		FROM orders 
		WHERE id = ?
	`, orderID).Scan(
		&sessionID, &paymentLink, &orderStatus, &paymentStatus, 
		&paymentMethod, &orderAmount, &createdAt, &updatedAt)
	
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error fetching order: " + err.Error()})
		}
		return
	}

	// 如果有Stripe会话ID，则从Stripe获取最新状态
	var stripeStatus string = paymentStatus
	var paymentTime time.Time
	var transactionID string = sessionID
	
	if sessionID != "" {
		// 尝试从Stripe获取最新支付状态
		paymentResult, verifyErr := PaymentProcessor.VerifyPaymentSession(c.Request.Context(), sessionID)
		if verifyErr == nil && paymentResult != nil {
			// 如果成功获取到支付信息，使用最新状态
			stripeStatus = paymentResult.Status
			transactionID = paymentResult.TransactionID
			paymentTime = paymentResult.PaymentTime
			
			// 如果状态不匹配，更新数据库中的状态
			if (stripeStatus == "paid" && paymentStatus != "completed") {
				// 异步更新订单状态
				go func(ordID int, payRes *payment.PaymentResult) {
					// 此处不处理错误，因为这只是一个状态同步
					db.DB.Exec(`
						UPDATE orders 
						SET order_status = ?, payment_status = ?, updated_at = ? 
						WHERE id = ?
					`, "paid&processing", "completed", time.Now(), ordID)
				}(orderID, paymentResult)
			}
		}
	}

	// 返回支付状态信息
	c.JSON(http.StatusOK, gin.H{
		"order_id":       orderID,
		"order_status":   orderStatus,
		"payment_status": stripeStatus,
		"payment_link":   paymentLink,
		"session_id":     sessionID,
		"transaction_id": transactionID,
		"payment_method": paymentMethod,
		"amount":         orderAmount,
		"created_at":     createdAt,
		"updated_at":     updatedAt,
		"payment_time":   paymentTime,
	})
}
