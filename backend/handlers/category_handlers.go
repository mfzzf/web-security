package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"web-security/backend/db"
	"web-security/backend/models"

	"github.com/gin-gonic/gin"
)

// CreateCategory handles the creation of a new category.
func CreateCategory(c *gin.Context) {
	var req models.CategoryCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	stmt, err := db.DB.Prepare(`
		INSERT INTO categories(
			name, description, icon, image, display_order, parent_id, is_featured
		) VALUES(?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare statement: " + err.Error()})
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(
		req.Name, 
		req.Description, 
		req.Icon, 
		req.Image, 
		req.DisplayOrder, 
		req.ParentID, 
		req.IsFeatured,
	)
	if err != nil {
		// Consider checking for unique constraint violation specifically
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category: " + err.Error()})
		return
	}

	id, _ := res.LastInsertId()
	
	// Fetch the complete category with all fields
	var category models.Category
	err = db.DB.QueryRow(`
		SELECT id, name, description, icon, image, display_order, parent_id, 
		is_featured, created_at, updated_at
		FROM categories WHERE id = ?
	`, id).Scan(
		&category.ID, &category.Name, &category.Description, &category.Icon,
		&category.Image, &category.DisplayOrder, &category.ParentID,
		&category.IsFeatured, &category.CreatedAt, &category.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Category created but failed to retrieve: " + err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, category)
}

// GetCategories handles fetching all categories.
func GetCategories(c *gin.Context) {
	// Support for parent_id filtering
	parentIDStr := c.Query("parent_id")
	
	// Supporting featured flag filtering
	isFeaturedStr := c.Query("is_featured")
	
	// Basic query
	baseQuery := `
		SELECT id, name, description, icon, image, display_order, parent_id, 
		is_featured, created_at, updated_at
		FROM categories
	`
	
	// Build WHERE clause based on filters
	whereClause := ""
	args := []interface{}{}
	
	if parentIDStr != "" {
		if parentIDStr == "null" || parentIDStr == "none" {
			// Filter for root categories (where parent_id is NULL)
			if whereClause == "" {
				whereClause = " WHERE parent_id IS NULL"
			} else {
				whereClause += " AND parent_id IS NULL"
			}
		} else {
			// Filter for specific parent_id
			parentID, err := strconv.Atoi(parentIDStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent ID format"})
				return
			}
			
			if whereClause == "" {
				whereClause = " WHERE parent_id = ?"
			} else {
				whereClause += " AND parent_id = ?"
			}
			args = append(args, parentID)
		}
	}
	
	if isFeaturedStr == "true" {
		if whereClause == "" {
			whereClause = " WHERE is_featured = TRUE"
		} else {
			whereClause += " AND is_featured = TRUE"
		}
	}
	
	// Order by display_order and then by name
	orderClause := " ORDER BY display_order ASC, name ASC"
	
	// Complete the query
	query := baseQuery + whereClause + orderClause
	
	rows, err := db.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories: " + err.Error()})
		return
	}
	defer rows.Close()

	categories := []models.Category{}
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(
			&cat.ID, &cat.Name, &cat.Description, &cat.Icon, &cat.Image, 
			&cat.DisplayOrder, &cat.ParentID, &cat.IsFeatured, 
			&cat.CreatedAt, &cat.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan category row: " + err.Error()})
			return
		}
		categories = append(categories, cat)
	}
	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating category rows: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// GetCategoryByID handles fetching a single category by its ID.
func GetCategoryByID(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var cat models.Category
	err = db.DB.QueryRow(`
		SELECT id, name, description, icon, image, display_order, parent_id, 
		is_featured, created_at, updated_at
		FROM categories WHERE id = ?
	`, categoryID).Scan(
		&cat.ID, &cat.Name, &cat.Description, &cat.Icon, &cat.Image,
		&cat.DisplayOrder, &cat.ParentID, &cat.IsFeatured,
		&cat.CreatedAt, &cat.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}
	
	// Optionally fetch subcategories as well
	includeChildren := c.Query("include_children") == "true"
	if includeChildren {
		rows, err := db.DB.Query(`
			SELECT id, name, description, icon, image, display_order, parent_id, 
			is_featured, created_at, updated_at
			FROM categories WHERE parent_id = ? ORDER BY display_order ASC, name ASC
		`, cat.ID)
		if err == nil {
			defer rows.Close()
			
			subcategories := []models.Category{}
			for rows.Next() {
				var subcat models.Category
				if err := rows.Scan(
					&subcat.ID, &subcat.Name, &subcat.Description, &subcat.Icon, &subcat.Image,
					&subcat.DisplayOrder, &subcat.ParentID, &subcat.IsFeatured,
					&subcat.CreatedAt, &subcat.UpdatedAt,
				); err == nil {
					subcategories = append(subcategories, subcat)
				}
			}
			
			// Include subcategories in the response
			c.JSON(http.StatusOK, gin.H{
				"category": cat,
				"subcategories": subcategories,
			})
			return
		}
	}
	
	c.JSON(http.StatusOK, cat)
}

// UpdateCategory handles updating an existing category.
func UpdateCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var req models.CategoryUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	// Fetch current category to ensure it exists and to have default values
	var currentCategory models.Category
	err = db.DB.QueryRow(`
		SELECT name, description, icon, image, display_order, parent_id, is_featured 
		FROM categories WHERE id = ?
	`, categoryID).Scan(
		&currentCategory.Name, &currentCategory.Description, &currentCategory.Icon,
		&currentCategory.Image, &currentCategory.DisplayOrder, &currentCategory.ParentID,
		&currentCategory.IsFeatured,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error on fetch: " + err.Error()})
		}
		return
	}

	// Apply updates using values from request or current values if not provided
	nameToUpdate := currentCategory.Name
	if req.Name != nil {
		nameToUpdate = *req.Name
	}
	descriptionToUpdate := currentCategory.Description
	if req.Description != nil {
		descriptionToUpdate = *req.Description
	}
	iconToUpdate := currentCategory.Icon
	if req.Icon != nil {
		iconToUpdate = *req.Icon
	}
	imageToUpdate := currentCategory.Image
	if req.Image != nil {
		imageToUpdate = *req.Image
	}
	displayOrderToUpdate := currentCategory.DisplayOrder
	if req.DisplayOrder != nil {
		displayOrderToUpdate = *req.DisplayOrder
	}
	parentIDToUpdate := currentCategory.ParentID
	if req.ParentID != nil {
		parentIDToUpdate = req.ParentID
	}
	isFeaturedToUpdate := currentCategory.IsFeatured
	if req.IsFeatured != nil {
		isFeaturedToUpdate = *req.IsFeatured
	}

	// SECURE QUERY CONSTRUCTION using parameterized query
	updateQuery := `
		UPDATE categories SET 
		name = ?, description = ?, icon = ?, image = ?, 
		display_order = ?, parent_id = ?, is_featured = ? 
		WHERE id = ?
	`

	stmt, err := db.DB.Prepare(updateQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare update: " + err.Error()})
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(
		nameToUpdate, descriptionToUpdate, iconToUpdate, imageToUpdate,
		displayOrderToUpdate, parentIDToUpdate, isFeaturedToUpdate,
		categoryID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category: " + err.Error()})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or no change made"})
		return
	}
	
	// Fetch the updated category to return it
	var updatedCategory models.Category
	err = db.DB.QueryRow(`
		SELECT id, name, description, icon, image, display_order, parent_id, 
		is_featured, created_at, updated_at
		FROM categories WHERE id = ?
	`, categoryID).Scan(
		&updatedCategory.ID, &updatedCategory.Name, &updatedCategory.Description, 
		&updatedCategory.Icon, &updatedCategory.Image, &updatedCategory.DisplayOrder, 
		&updatedCategory.ParentID, &updatedCategory.IsFeatured,
		&updatedCategory.CreatedAt, &updatedCategory.UpdatedAt,
	)
	if err != nil {
		// This shouldn't happen if update was successful, but good to check
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated category: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedCategory)
}

// DeleteCategory handles deleting a category by its ID.
func DeleteCategory(c *gin.Context) {
	categoryIDStr := c.Param("id")
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Optional: Check if any products are associated with this category before deleting
	// For simplicity, this check is omitted here. The DB schema uses ON DELETE SET NULL for products.

	stmt, err := db.DB.Prepare("DELETE FROM categories WHERE id = ?")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare delete statement: " + err.Error()})
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category: " + err.Error()})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}
