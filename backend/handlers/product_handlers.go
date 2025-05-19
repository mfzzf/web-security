package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"web-security/backend/db"
	"web-security/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/microcosm-cc/bluemonday" // For XSS sanitization
)

var xssPolicy = bluemonday.UGCPolicy()

// CreateProduct handles the creation of a new product.
func CreateProduct(c *gin.Context) {
	var req models.ProductCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	// Sanitize content for XSS protection
	sanitizedName := xssPolicy.Sanitize(req.Name)
	sanitizedDescription := xssPolicy.Sanitize(req.Description)
	
	// Default values
	if !req.IsActive {
		req.IsActive = true // Products are active by default
	}

	stmt, err := db.DB.Prepare(`
		INSERT INTO products(
			name, description, price, discount_price, stock_quantity, 
			category_id, image_main, images_gallery, sku, 
			is_featured, is_active, tags
		) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare statement: " + err.Error()})
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(
		sanitizedName, 
		sanitizedDescription, 
		req.Price, 
		req.DiscountPrice, 
		req.StockQuantity, 
		req.CategoryID,
		req.ImageMain,
		req.ImagesGallery,
		req.SKU,
		req.IsFeatured,
		req.IsActive,
		req.Tags,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product: " + err.Error()})
		return
	}

	id, _ := res.LastInsertId()
	
	// Fetch the created product to return complete data including DB defaults
	var product models.Product
	err = db.DB.QueryRow(`
		SELECT id, name, description, price, discount_price, stock_quantity, 
		category_id, image_main, images_gallery, sku, is_featured, is_active, 
		view_count, tags, created_at, updated_at 
		FROM products WHERE id = ?
	`, id).Scan(
		&product.ID, &product.Name, &product.Description, &product.Price,
		&product.DiscountPrice, &product.StockQuantity, &product.CategoryID,
		&product.ImageMain, &product.ImagesGallery, &product.SKU,
		&product.IsFeatured, &product.IsActive, &product.ViewCount,
		&product.Tags, &product.CreatedAt, &product.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Product created but failed to retrieve: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// GetProducts handles fetching all products.
func GetProducts(c *gin.Context) {
	// Support for category filtering
	categoryIDStr := c.Query("category_id")
	
	// Additional query parameters for filtering
	isFeaturedStr := c.Query("is_featured")
	isActiveStr := c.DefaultQuery("is_active", "true") // Default to active products

	// Basic query
	baseQuery := `
		SELECT id, name, description, price, discount_price, stock_quantity, 
		category_id, image_main, images_gallery, sku, is_featured, is_active, 
		view_count, tags, created_at, updated_at 
		FROM products
	`
	
	// Build WHERE clause based on filters
	whereClause := ""
	args := []interface{}{}
	
	if categoryIDStr != "" {
		if whereClause == "" {
			whereClause = " WHERE category_id = ?"
		} else {
			whereClause += " AND category_id = ?"
		}
		categoryID, err := strconv.Atoi(categoryIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID format"})
			return
		}
		args = append(args, categoryID)
	}
	
	if isFeaturedStr != "" {
		isFeatured := isFeaturedStr == "true"
		if whereClause == "" {
			whereClause = " WHERE is_featured = ?"
		} else {
			whereClause += " AND is_featured = ?"
		}
		args = append(args, isFeatured)
	}
	
	isActive := isActiveStr == "true"
	if whereClause == "" {
		whereClause = " WHERE is_active = ?"
	} else {
		whereClause += " AND is_active = ?"
	}
	args = append(args, isActive)
	
	// Complete the query
	query := baseQuery + whereClause
	
	rows, err := db.DB.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products: " + err.Error()})
		return
	}
	defer rows.Close()

	products := []models.Product{}
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Description, &p.Price, &p.DiscountPrice,
			&p.StockQuantity, &p.CategoryID, &p.ImageMain, &p.ImagesGallery,
			&p.SKU, &p.IsFeatured, &p.IsActive, &p.ViewCount, &p.Tags,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan product row: " + err.Error()})
			return
		}
		products = append(products, p)
	}
	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating product rows: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetProductByID handles fetching a single product by its ID.
// THIS IS NOW SECURED AGAINST SQL INJECTION.
func GetProductByID(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr) // Convert to int first
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID format"})
		return
	}

	query := `
		SELECT id, name, description, price, discount_price, stock_quantity, 
		category_id, image_main, images_gallery, sku, is_featured, is_active, 
		view_count, tags, created_at, updated_at 
		FROM products WHERE id = ?
	`
	var p models.Product
	// Using QueryRow with parameterized query
	err = db.DB.QueryRow(query, productID).Scan(
		&p.ID, &p.Name, &p.Description, &p.Price, &p.DiscountPrice, 
		&p.StockQuantity, &p.CategoryID, &p.ImageMain, &p.ImagesGallery,
		&p.SKU, &p.IsFeatured, &p.IsActive, &p.ViewCount, &p.Tags,
		&p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}
	
	// Update view count
	_, err = db.DB.Exec("UPDATE products SET view_count = view_count + 1 WHERE id = ?", productID)
	if err != nil {
		// Log the error but don't fail the request
		fmt.Printf("Error updating view count: %v\n", err)
	}
	
	c.JSON(http.StatusOK, p)
}

// UpdateProduct handles updating an existing product.
// THIS IS NOW SECURED AGAINST SQL INJECTION.
func UpdateProduct(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req models.ProductUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	// Fetch current product to ensure it exists and to have default values
	var currentProduct models.Product
	err = db.DB.QueryRow(`
		SELECT name, description, price, discount_price, stock_quantity, 
		category_id, image_main, images_gallery, sku, is_featured, 
		is_active, view_count, tags 
		FROM products WHERE id = ?
	`, productID).Scan(
		&currentProduct.Name, &currentProduct.Description, &currentProduct.Price,
		&currentProduct.DiscountPrice, &currentProduct.StockQuantity, &currentProduct.CategoryID,
		&currentProduct.ImageMain, &currentProduct.ImagesGallery, &currentProduct.SKU,
		&currentProduct.IsFeatured, &currentProduct.IsActive, &currentProduct.ViewCount,
		&currentProduct.Tags,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error on fetch: " + err.Error()})
		}
		return
	}

	// Apply updates using values from request or current values if not provided
	nameToUpdate := currentProduct.Name
	if req.Name != nil {
		nameToUpdate = xssPolicy.Sanitize(*req.Name) // Sanitize Name for XSS
	}
	descriptionToUpdate := currentProduct.Description
	if req.Description != nil {
		descriptionToUpdate = xssPolicy.Sanitize(*req.Description) // Sanitize Description for XSS
	}
	priceToUpdate := currentProduct.Price
	if req.Price != nil {
		priceToUpdate = *req.Price
	}
	var discountPriceToUpdate *float64 = currentProduct.DiscountPrice
	if req.DiscountPrice != nil {
		discountPriceToUpdate = req.DiscountPrice
	}
	stockToUpdate := currentProduct.StockQuantity
	if req.StockQuantity != nil {
		stockToUpdate = *req.StockQuantity
	}
	categoryToUpdate := currentProduct.CategoryID
	if req.CategoryID != nil {
		categoryToUpdate = *req.CategoryID
	}
	imageMainToUpdate := currentProduct.ImageMain
	if req.ImageMain != nil {
		imageMainToUpdate = *req.ImageMain
	}
	imagesGalleryToUpdate := currentProduct.ImagesGallery
	if req.ImagesGallery != nil {
		imagesGalleryToUpdate = *req.ImagesGallery
	}
	skuToUpdate := currentProduct.SKU
	if req.SKU != nil {
		skuToUpdate = *req.SKU
	}
	isFeaturedToUpdate := currentProduct.IsFeatured
	if req.IsFeatured != nil {
		isFeaturedToUpdate = *req.IsFeatured
	}
	isActiveToUpdate := currentProduct.IsActive
	if req.IsActive != nil {
		isActiveToUpdate = *req.IsActive
	}
	viewCountToUpdate := currentProduct.ViewCount
	if req.ViewCount != nil {
		viewCountToUpdate = *req.ViewCount
	}
	tagsToUpdate := currentProduct.Tags
	if req.Tags != nil {
		tagsToUpdate = *req.Tags
	}

	// SECURE QUERY CONSTRUCTION using parameterized query
	updateQuery := `
		UPDATE products SET 
		name = ?, description = ?, price = ?, discount_price = ?, stock_quantity = ?, 
		category_id = ?, image_main = ?, images_gallery = ?, sku = ?, 
		is_featured = ?, is_active = ?, view_count = ?, tags = ? 
		WHERE id = ?
	`

	stmt, err := db.DB.Prepare(updateQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare update: " + err.Error()})
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		nameToUpdate, descriptionToUpdate, priceToUpdate, discountPriceToUpdate, stockToUpdate,
		categoryToUpdate, imageMainToUpdate, imagesGalleryToUpdate, skuToUpdate,
		isFeaturedToUpdate, isActiveToUpdate, viewCountToUpdate, tagsToUpdate,
		productID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product: " + err.Error()})
		return
	}

	// Fetch the updated product to show the result
	var p models.Product
	err = db.DB.QueryRow(`
		SELECT id, name, description, price, discount_price, stock_quantity, 
		category_id, image_main, images_gallery, sku, is_featured, is_active, 
		view_count, tags, created_at, updated_at 
		FROM products WHERE id = ?
	`, productID).Scan(
		&p.ID, &p.Name, &p.Description, &p.Price, &p.DiscountPrice, 
		&p.StockQuantity, &p.CategoryID, &p.ImageMain, &p.ImagesGallery,
		&p.SKU, &p.IsFeatured, &p.IsActive, &p.ViewCount, &p.Tags,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		// This should ideally not happen if the update was successful
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch product post-update: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// DeleteProduct handles deleting a product by its ID.
func DeleteProduct(c *gin.Context) {
	productIDStr := c.Param("id")
	productID, err := strconv.Atoi(productIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	stmt, err := db.DB.Prepare("DELETE FROM products WHERE id = ?")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare delete statement: " + err.Error()})
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product: " + err.Error()})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}
