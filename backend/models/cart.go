package models

import (
	"time"
)

// CartItem 代表数据库中的购物车项目
type CartItem struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProductID int       `json:"product_id"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CartItemRequest 用于添加/更新购物车的请求
type CartItemRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}

// CartItemResponse 用于返回给前端的购物车项信息
type CartItemResponse struct {
	ID         int     `json:"id"`
	ProductID  int     `json:"product_id"`
	Name       string  `json:"name"`
	Price      float64 `json:"price"`
	Quantity   int     `json:"quantity"`
	ImageUrl   string  `json:"imageUrl"`
	TotalPrice float64 `json:"total_price"`
}

// CartSummary 用于返回完整的购物车摘要信息
type CartSummary struct {
	Items         []CartItemResponse `json:"items"`
	TotalQuantity int                `json:"total_quantity"`
	TotalAmount   float64            `json:"total_amount"`
}
