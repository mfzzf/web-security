package models

import (
	"time"
)

// Order represents the structure of our order table
type Order struct {
	ID              int         `json:"id"`
	OrderNumber     string      `json:"order_number"` // 添加OrderNumber字段
	UserID          int         `json:"user_id" binding:"required"`
	TotalAmount     float64     `json:"total_amount" binding:"required,gt=0"`
	Status          string      `json:"status" binding:"required"` // e.g., unpaid, paid&processing, shipped, delivered, cancelled
	ShippingAddress string      `json:"shipping_address" binding:"required"`
	PaymentIntentID string      `json:"payment_intent_id,omitempty"`
	PaymentLink     string      `json:"payment_link,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
	OrderItems      []OrderItem `json:"order_items"` // Associated order items
}

// OrderItem represents the structure of our order_item table
type OrderItem struct {
	ID              int       `json:"id"`
	OrderID         int       `json:"order_id" binding:"required"`
	ProductID       int       `json:"product_id" binding:"required"`
	ProductName     string    `json:"product_name" binding:"required"`
	ProductSKU      string    `json:"product_sku"`
	Quantity        int       `json:"quantity" binding:"required,gt=0"`
	UnitPrice       float64   `json:"unit_price" binding:"required,gt=0"`
	DiscountAmount  float64   `json:"discount_amount"`
	PriceAtPurchase float64   `json:"price_at_purchase" binding:"required,gt=0"` // Price of the product at the time of purchase
	Subtotal        float64   `json:"subtotal" binding:"required,gt=0"`
	ItemStatus      string    `json:"item_status"`
	CreatedAt       time.Time `json:"created_at"`
}

// OrderCreateRequest represents the data needed to create a new order
type OrderCreateRequest struct {
	UserID          int                `json:"user_id" binding:"required"` // Usually obtained from authenticated user context
	ShippingAddress string             `json:"shipping_address" binding:"required"`
	Items           []OrderItemRequest `json:"items" binding:"required,dive"` // dive validates each element in the slice
}

// OrderItemRequest represents a single item in an order creation request
type OrderItemRequest struct {
	ProductID int `json:"product_id" binding:"required,gt=0"`
	Quantity  int `json:"quantity" binding:"required,gt=0"`
}

// OrderUpdateStatusRequest represents the data needed to update an order's status
type OrderUpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
