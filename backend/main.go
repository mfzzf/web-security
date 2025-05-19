package main

import (
	"log"
	"net/http"
	"os"

	"web-security/backend/config"
	"web-security/backend/db"
	"web-security/backend/handlers"

	"github.com/gin-gonic/gin"

	"web-security/backend/redis_client" // Renamed from redis to redis_client to avoid conflict
	"web-security/backend/routes"       // Import routes package
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Could not load config: %v", err)
	}

	// Initialize database connection
	db.InitMySQL(cfg.DBSource)
	defer db.CloseMySQL()

	// Initialize Redis client
	redis_client.InitRedis(cfg.RedisAddress, cfg.RedisPassword, cfg.RedisDB)
	defer redis_client.CloseRedis() // Added defer to close Redis connection

	// Initialize Stripe payment processor
	frontendURL := "http://localhost:3000" // Frontend URL for payment callbacks
	handlers.InitPaymentProcessor(cfg.StripeAPIKey, frontendURL)

	// Set Gin mode (release, debug, test)
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.DebugMode // Default to debug mode
	}
	gin.SetMode(ginMode)

	router := gin.Default()

	// 为所有请求添加CORS头的自定义中间件
	router.Use(func(c *gin.Context) {
		// 获取请求源
		origin := c.Request.Header.Get("Origin")
		
		// 允许所有来源 - 在开发环境中通常这是安全的
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24小时

		// 如果是OPTIONS请求，直接返回200 OK
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}

		c.Next()
	})

	// 配置静态文件服务
	router.Static("/product-images", "./static/product-images") // 提供产品图片访问

	// Simple health check route
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// Setup routes
	api := router.Group("/api")
	// 添加新的认证路由
	routes.SetupAuthRoutes(api.Group("/auth"))
	routes.SetupUserRoutes(api.Group("/users"))
	routes.SetupProductRoutes(api.Group("/products"))
	routes.SetupCategoryRoutes(api.Group("/categories"))
	routes.SetupOrderRoutes(api.Group("/orders"))
	routes.SetupPaymentRoutes(api.Group("/payments"))
	routes.SetupCartRoutes(api.Group("/cart")) // 添加购物车路由

	// Start server
	serverAddr := cfg.ServerAddress
	if serverAddr == "" {
		serverAddr = ":8080" // Default port if not in config
	}
	log.Printf("Server starting on %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
