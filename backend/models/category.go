package models

import (
	"time"
)

// Category represents the structure of our category table
type Category struct {
	ID           int       `json:"id"`
	Name         string    `json:"name" binding:"required"`
	Description  string    `json:"description,omitempty"`
	Icon         string    `json:"icon,omitempty"`
	Image        string    `json:"image,omitempty"`
	DisplayOrder int       `json:"display_order"`
	ParentID     *int      `json:"parent_id,omitempty"`
	IsFeatured   bool      `json:"is_featured"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CategoryCreate represents the data needed to create a new category
type CategoryCreate struct {
	Name         string `json:"name" binding:"required,min=2,max=50"`
	Description  string `json:"description,omitempty"`
	Icon         string `json:"icon,omitempty"`
	Image        string `json:"image,omitempty"`
	DisplayOrder int    `json:"display_order"`
	ParentID     *int   `json:"parent_id,omitempty"`
	IsFeatured   bool   `json:"is_featured"`
}

// CategoryUpdate represents the data needed to update an existing category
type CategoryUpdate struct {
	Name         *string `json:"name,omitempty"` // Pointer to allow partial updates
	Description  *string `json:"description,omitempty"`
	Icon         *string `json:"icon,omitempty"`
	Image        *string `json:"image,omitempty"`
	DisplayOrder *int    `json:"display_order,omitempty"`
	ParentID     *int    `json:"parent_id,omitempty"`
	IsFeatured   *bool   `json:"is_featured,omitempty"`
}
