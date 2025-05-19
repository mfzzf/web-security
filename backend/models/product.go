package models

import (
	"time"
)

// Product represents the structure of our product table
type Product struct {
	ID            int       `json:"id"`
	Name          string    `json:"name" binding:"required"`
	Description   string    `json:"description"`
	Price         float64   `json:"price" binding:"required,gt=0"`
	DiscountPrice *float64  `json:"discount_price,omitempty"`
	StockQuantity int       `json:"stock_quantity" binding:"gte=0"`
	CategoryID    int       `json:"category_id" binding:"required"`
	ImageMain     string    `json:"image_main,omitempty"`
	ImagesGallery string    `json:"images_gallery,omitempty"` // JSON array string
	SKU           string    `json:"sku,omitempty"`
	IsFeatured    bool      `json:"is_featured"`
	IsActive      bool      `json:"is_active"`
	ViewCount     int       `json:"view_count"`
	Tags          string    `json:"tags,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ProductCreate represents the data needed to create a new product
type ProductCreate struct {
	Name          string   `json:"name" binding:"required,min=3,max=100"`
	Description   string   `json:"description"`
	Price         float64  `json:"price" binding:"required,gt=0"`
	DiscountPrice *float64 `json:"discount_price,omitempty"`
	StockQuantity int      `json:"stock_quantity" binding:"required,gte=0"`
	CategoryID    int      `json:"category_id" binding:"required,gt=0"`
	ImageMain     string   `json:"image_main,omitempty"`
	ImagesGallery string   `json:"images_gallery,omitempty"`
	SKU           string   `json:"sku,omitempty"`
	IsFeatured    bool     `json:"is_featured"`
	IsActive      bool     `json:"is_active" binding:"required"`
	Tags          string   `json:"tags,omitempty"`
}

// ProductUpdate represents the data needed to update an existing product
type ProductUpdate struct {
	Name          *string  `json:"name,omitempty"` // Pointers to allow partial updates
	Description   *string  `json:"description,omitempty"`
	Price         *float64 `json:"price,omitempty"`
	DiscountPrice *float64 `json:"discount_price,omitempty"`
	StockQuantity *int     `json:"stock_quantity,omitempty"`
	CategoryID    *int     `json:"category_id,omitempty"`
	ImageMain     *string  `json:"image_main,omitempty"`
	ImagesGallery *string  `json:"images_gallery,omitempty"`
	SKU           *string  `json:"sku,omitempty"`
	IsFeatured    *bool    `json:"is_featured,omitempty"`
	IsActive      *bool    `json:"is_active,omitempty"`
	ViewCount     *int     `json:"view_count,omitempty"`
	Tags          *string  `json:"tags,omitempty"`
}
