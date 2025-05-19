# Web Security E-commerce Platform

## 1. 项目概述 (Project Overview)

本项目是一个电子商城平台，最初用于演示 Web 安全相关的概念，现已重构为一个功能完善的常规电子商城，移除了已知的安全漏洞，并专注于提供稳定、安全的用户体验。平台包含用户前台、管理员后台、商品展示、购物车、订单处理和支付等核心电商功能。

## 2. 技术栈 (Tech Stack)

-   **后端 (Backend):**
    -   语言: Go
    -   框架: Gin Web Framework
    -   数据库交互: GORM (推测，或原生 SQL)
    -   身份认证: JWT (JSON Web Tokens)
-   **前端 (Frontend):**
    -   框架/库: React (Create React App)
    -   路由: React Router DOM
    -   状态管理: Redux (Redux Toolkit)
    -   UI 组件: Potentially 21st Magic (as per memory), custom components
    -   通知: `react-toastify`
-   **数据库 (Database):** MySQL
-   **缓存 (Caching):** Redis
-   **支付网关 (Payment Gateway):** Stripe
-   **开发工具 & 环境:**
    -   Go Modules for backend dependency management
    -   npm/yarn for frontend dependency management

## 3. 项目结构 (Project Structure)

### 3.1 后端 (Backend - `/backend`)

```
/backend
├── .git/                 # Git-related files
├── .gitignore            # Specifies intentionally untracked files that Git should ignore
├── app.env               # Application environment variables (actual values)
├── app.env.example       # Example environment variables
├── config/               # Configuration loading (e.g., app.env parsing)
│   └── config.go
├── db/                   # Database connection and migration logic
│   ├── db.go
│   └── migrations/       # (推测) Database migration files
├── go.mod                # Go module definition file
├── go.sum                # Go module checksums
├── handlers/             # HTTP request handlers (controllers)
│   ├── auth_handlers.go
│   ├── cart_handlers.go
│   ├── category_handlers.go
│   ├── order_handlers.go
│   ├── payment_handlers.go
│   ├── product_handlers.go
│   └── user_handlers.go
├── main.go               # Main application entry point
├── middleware/           # Custom Gin middleware (e.g., authentication, admin checks)
│   └── auth_middleware.go
├── models/               # Database models (structs representing DB tables)
│   ├── cart.go
│   ├── category.go
│   ├── order.go
│   ├── product.go
│   └── user.go
├── payment/              # Payment processing logic (e.g., Stripe integration)
│   └── stripe.go
├── redis_client/         # Redis client initialization and interaction logic
│   └── redis.go
├── routes/               # API route definitions
│   ├── auth_routes.go
│   ├── cart_routes.go
│   ├── category_routes.go
│   ├── order_routes.go
│   ├── payment_routes.go
│   ├── product_routes.go
│   └── user_routes.go
├── static/               # Static assets (e.g., product images)
│   └── product-images/
└── utils/                # Utility functions (e.g., password hashing, token generation)
    ├── hash.go
    └── token.go
```

### 3.2 前端 (Frontend - `/frontend-react`)

```
/frontend-react
├── .git/                 # Git-related files
├── .gitignore            # Specifies intentionally untracked files that Git should ignore
├── README.md             # Frontend specific README (if exists from CRA)
├── node_modules/         # Node.js dependencies (managed by npm/yarn)
├── package-lock.json     # Exact versions of dependencies
├── package.json          # Project metadata and dependencies
├── public/               # Static assets served directly
│   ├── index.html        # Main HTML page
│   └── ...
└── src/                  # Main application source code
    ├── App.css             # Global application styles
    ├── App.js              # Main application component with routing setup
    ├── index.css           # Global CSS styles for index.html
    ├── index.js            # Entry point for the React application
    ├── reportWebVitals.js  # Web vitals reporting
    ├── assets/             # Images, fonts, etc.
    ├── components/         # Reusable UI components
    │   ├── layout/         # Layout components (Navbar, Footer)
    │   ├── admin/          # Admin-specific layout and components
    │   └── ...             # Other general components (CartPopup, etc.)
    ├── pages/              # Top-level page components
    │   ├── admin/          # Admin panel pages (Dashboard, Products, Orders, etc.)
    │   ├── Home.js
    │   ├── Login.js
    │   ├── Products.js
    │   └── ...             # Other public pages
    ├── services/           # API call functions (e.g., using axios or fetch)
    ├── store/              # Redux store configuration
    │   ├── slices/         # Redux slices for different features (auth, cart, product)
    │   └── index.js        # Root store configuration
    └── utils/              # Frontend utility functions
```

## 4. 数据库设计 (Database Design)

### 4.1 概述 (Overview)

项目使用 MySQL 关系型数据库存储所有持久化数据，包括用户信息、商品、订单等。

### 4.2 表结构 (Table Structures)

以下是数据库的主要表结构定义 (DDL)：

```sql
-- Navicat Premium Dump SQL
-- Source Server         : mysql
-- Source Server Type    : MySQL
-- Source Server Version : 90100 (9.1.0)
-- Source Host           : localhost:3306
-- Source Schema         : web_security
-- Target Server Type    : MySQL
-- Target Server Version : 90100 (9.1.0)
-- File Encoding         : 65001
-- Date: 19/05/2025 07:53:48

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for cart_items
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_cart_items_user_id` (`user_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `icon` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `parent_id` int DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_categories_parent_id` (`parent_id`),
  KEY `idx_categories_is_featured` (`is_featured`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for order_items
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `product_sku` varchar(50) DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price_at_purchase` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `item_status` enum('unpaid','paid&processing','shipped','delivered','cancelled') DEFAULT 'unpaid',
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for orders
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` enum('pending','processing','completed','failed','refunded') DEFAULT 'pending',
  `shipping_address` text NOT NULL,
  `billing_address` text,
  `shipping_tracking` varchar(100) DEFAULT NULL,
  `notes` text,
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `payment_link` varchar(1024) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_status` enum('unpaid','paid&processing','shipped','delivered','cancelled') DEFAULT 'unpaid',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_payment_status` (`payment_status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for products
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `category_id` int DEFAULT NULL,
  `image_main` varchar(255) DEFAULT NULL,
  `images_gallery` text,
  `sku` varchar(50) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `view_count` int DEFAULT '0',
  `tags` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_is_featured` (`is_featured`),
  KEY `idx_products_is_active` (`is_active`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for reviews
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `comment` text,
  `is_approved` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product_id` (`product_id`),
  KEY `idx_reviews_user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state_province` varchar(100) DEFAULT NULL,
  `zip_postal_code` varchar(20) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `last_login` timestamp NULL DEFAULT NULL,
  `account_status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `refresh_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for wishlist
DROP TABLE IF EXISTS `wishlist`;
CREATE TABLE `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_wishlist_user_id` (`user_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

### 4.3 主要关系 (Key Relationships)

-   `users` (1) -- (*) `orders`: 一个用户可以有多个订单。
-   `users` (1) -- (*) `cart_items`: 一个用户购物车中可以有多个商品项。
-   `users` (1) -- (*) `reviews`: 一个用户可以发表多个评论。
-   `users` (1) -- (*) `wishlist`: 一个用户的心愿单中可以有多个商品。
-   `products` (1) -- (*) `cart_items`: 一个商品可以被添加到多个购物车项中。
-   `products` (1) -- (*) `order_items`: 一个商品可以出现在多个订单项中。
-   `products` (1) -- (*) `reviews`: 一个商品可以有多条评论。
-   `products` (1) -- (*) `wishlist`: 一个商品可以被添加到多个心愿单中。
-   `categories` (1) -- (*) `products`: 一个分类下可以有多个商品。
-   `categories` (1) -- (*) `categories` (parent_id): 支持多级分类。
-   `orders` (1) -- (*) `order_items`: 一个订单包含多个订单项。

## 5. 核心功能 (Core Features)

### 5.1 用户认证与管理 (User Authentication & Management)

-   **用户注册:** 新用户可以通过 `/api/auth/register` 端点创建账户。
-   **用户登录:** 已注册用户可以通过 `/api/auth/login` 端点登录，成功后返回 JWT 访问令牌和刷新令牌。
-   **令牌刷新:** 使用 `/api/auth/refresh` 端点，通过有效的刷新令牌获取新的访问令牌。
-   **用户注销:** 通过 `/api/auth/logout` (需认证) 使当前会话失效。
-   **会话管理:** 前端通过 `SessionManager` 组件在应用加载时尝试恢复用户会话。
-   **访问控制:**
    -   `AuthMiddleware`: 保护需要用户登录才能访问的路由。
    -   `AdminAuthMiddleware`: 保护仅限管理员访问的路由。

### 5.2 商品与分类 (Products & Categories)

-   **商品浏览:**
    -   获取所有商品列表: `GET /api/products`
    -   获取单个商品详情: `GET /api/products/:id`
-   **商品管理 (管理员):**
    -   创建商品: `POST /api/products`
    -   更新商品: `PUT /api/products/:id`
    -   删除商品: `DELETE /api/products/:id`
-   **分类浏览:**
    -   获取所有分类列表: `GET /api/categories`
    -   获取单个分类详情: `GET /api/categories/:id`
-   **分类管理 (管理员):**
    -   创建分类: `POST /api/categories`
    -   更新分类: `PUT /api/categories/:id`
    -   删除分类: `DELETE /api/categories/:id`

### 5.3 购物车 (Shopping Cart)

-   所有购物车操作均需用户认证 (`/api/cart` 基础路径)。
-   获取用户购物车: `GET /api/cart`
-   添加商品到购物车: `POST /api/cart`
-   更新购物车中商品数量: `PUT /api/cart/:id` (id 指 cart_item_id)
-   从购物车移除商品: `DELETE /api/cart/:id` (id 指 cart_item_id)
-   清空购物车: `DELETE /api/cart`

### 5.4 订单与支付 (Orders & Payments)

-   **创建订单:** `POST /api/orders` (需用户认证)，从购物车内容创建订单。
-   **查看订单:**
    -   用户查看自己的订单列表: `GET /api/orders/user/:userID` (需用户认证)
    -   查看特定订单详情: `GET /api/orders/:id` (需用户认证)
-   **支付处理 (Stripe):**
    -   创建支付会话 (Checkout): `POST /api/payments/orders/:id/checkout`
    -   检查支付状态: `GET /api/payments/orders/:id/payment-status`
    -   支付成功回调: `GET /api/payments/success` (由 Stripe 重定向)
    -   支付取消回调: `GET /api/payments/cancel` (由 Stripe 重定向)
-   **订单状态管理 (管理员):**
    -   更新订单状态: `PUT /api/orders/:id/status` (需管理员认证)

### 5.5 用户中心 (User Profile)

-   前端通过 `/profile` 路径访问用户个人资料页面。
-   查看和更新用户资料: `GET /api/users/profile`, `PUT /api/users/profile` (需用户认证)。
-   查看用户订单历史: 前端 `/orders` 页面，调用 `GET /api/orders/user/:userID`。

### 5.6 管理员后台 (Admin Panel)

-   前端通过 `/admin/*` 路径访问管理员专属页面，使用 `AdminLayout`。
-   **用户管理:**
    -   列出所有用户: `GET /api/users/admin`
    -   获取特定用户信息: `GET /api/users/admin/:id`
    -   更新用户状态: `PUT /api/users/admin/:id/status`
    -   删除用户: `DELETE /api/users/admin/:id`
-   其他管理功能包括商品管理、分类管理、订单管理等，对应各自的 API 端点。

## 6. API 端点概览 (API Endpoint Overview)

所有API端点均以 `/api` 为前缀。

-   **认证 (Authentication):** `/api/auth`
    -   `POST /register`: 用户注册
    -   `POST /login`: 用户登录
    -   `POST /refresh`: 刷新访问令牌
    -   `POST /logout`: 用户注销 (需认证)
-   **用户 (Users):** `/api/users`
    -   `GET /profile`: 获取当前用户资料 (需认证)
    -   `PUT /profile`: 更新当前用户资料 (需认证)
    -   `GET /preferences`: 获取用户偏好 (需认证, 示例)
    -   `PUT /preferences`: 更新用户偏好 (需认证, 示例)
    -   **管理员接口 (Admin Users):** `/api/users/admin`
        -   `GET /`: 获取所有用户列表 (需管理员认证)
        -   `GET /:id`: 获取指定ID用户信息 (需管理员认证)
        -   `PUT /:id/status`: 更新用户状态 (需管理员认证)
        -   `DELETE /:id`: 删除用户 (需管理员认证)
-   **产品 (Products):** `/api/products`
    -   `GET /`: 获取产品列表
    -   `GET /:id`: 获取单个产品详情
    -   `POST /`: 创建新产品 (目前无特定管理员认证，建议添加)
    -   `PUT /:id`: 更新产品信息 (目前无特定管理员认证，建议添加)
    -   `DELETE /:id`: 删除产品 (目前无特定管理员认证，建议添加)
-   **分类 (Categories):** `/api/categories`
    -   `GET /`: 获取分类列表
    -   `GET /:id`: 获取单个分类详情
    -   `POST /`: 创建新分类 (目前无特定管理员认证，建议添加)
    -   `PUT /:id`: 更新分类信息 (目前无特定管理员认证，建议添加)
    -   `DELETE /:id`: 删除分类 (目前无特定管理员认证，建议添加)
-   **订单 (Orders):** `/api/orders`
    -   `POST /`: 创建新订单 (需认证)
    -   `GET /user/:userID`: 获取指定用户的订单列表 (需认证)
    -   `GET /:id`: 获取单个订单详情 (需认证)
    -   `PUT /:id/status`: 更新订单状态 (需管理员认证)
-   **支付 (Payments):** `/api/payments`
    -   `POST /orders/:id/checkout`: 为订单创建支付会话
    -   `GET /orders/:id/payment-status`: 检查订单支付状态
    -   `GET /success`: 支付成功回调
    -   `GET /cancel`: 支付取消回调
-   **购物车 (Cart):** `/api/cart` (所有操作均需认证)
    -   `GET /`: 获取当前用户购物车
    -   `POST /`: 添加商品到购物车
    -   `PUT /:id`: 更新购物车项数量 (id 为 cart_item_id)
    -   `DELETE /:id`: 从购物车移除商品 (id 为 cart_item_id)
    -   `DELETE /`: 清空购物车

## 7. 安装与运行 (Setup and Running the Project)

### 7.1 环境准备 (Prerequisites)

-   Go (version 1.18+ recommended)
-   Node.js (version 16+ recommended) and npm or yarn
-   MySQL Server
-   Redis Server

### 7.2 后端配置与启动 (Backend Setup & Launch)

1.  **导航到后端目录:**
    ```bash
    cd backend
    ```
2.  **配置环境变量:**
    -   复制 `app.env.example` 为 `app.env`.
        ```bash
        cp app.env.example app.env
        ```
    -   编辑 `app.env` 文件，填入正确的数据库连接信息 (DBSource), Redis 地址 (RedisAddress, RedisPassword, RedisDB), Stripe API 密钥 (StripeAPIKey), 以及服务监听地址 (ServerAddress, 如 `:8080`)。
3.  **安装依赖:**
    ```bash
    go mod tidy
    ```
4.  **运行数据库迁移 (如果适用):** (当前项目结构未明确包含迁移脚本，需手动确保数据库表已根据上述DDL创建)
5.  **启动后端服务:**
    ```bash
    go run main.go
    ```
    服务器默认将在 `app.env` 中配置的 `ServerAddress` (例如 `http://localhost:8080`) 上运行。

### 7.3 前端配置与启动 (Frontend Setup & Launch)

1.  **导航到前端目录:**
    ```bash
    cd frontend-react
    ```
2.  **安装依赖:**
    ```bash
    npm install
    # 或者使用 yarn
    # yarn install
    ```
3.  **配置 API 地址 (如果需要):**
    前端应用通常会在 `src/services/api.js` 或类似文件中配置后端 API 的基础 URL。确保它指向正在运行的后端服务 (例如 `http://localhost:8080/api`)。
4.  **启动前端开发服务器:**
    ```bash
    npm start
    # 或者使用 yarn
    # yarn start
    ```
    应用通常会在 `http://localhost:3000` 上运行，并自动在浏览器中打开。

## 8. 前端路由 (Frontend Routing)

以下是前端应用中定义的主要页面路由：

-   **公共页面:**
    -   `/`: 首页 (`Home`)
    -   `/login`: 登录页 (`Login`)
    -   `/register`: 注册页 (`Register`)
    -   `/products`: 商品列表页 (`Products`)
    -   `/products/:id`: 商品详情页 (`ProductDetails`)
    -   `/categories`: 分类页 (`Categories`)
    -   `/cart`: 购物车页 (`Cart`)
    -   `/checkout`: 结算页 (`Checkout`)
    -   `/profile`: 用户个人资料页 (`Profile`)
    -   `/orders`: 用户订单历史页 (`OrderHistory`)
    -   `/orders/:id`: 用户订单详情页 (`OrderDetails`)
    -   `/payment/success`: 支付成功页 (`PaymentSuccess`)
    -   `/payment/cancel`: 支付取消页 (`PaymentCancel`)
-   **管理员页面 (以 `/admin` 为前缀):**
    -   `/admin`: 管理员仪表盘 (`AdminDashboard`)
    -   `/admin/products`: 管理员商品管理页 (`AdminProducts`)
    -   `/admin/categories`: 管理员分类管理页 (`AdminCategories`)
    -   `/admin/orders`: 管理员订单管理页 (`AdminOrders`)
    -   `/admin/users`: 管理员用户管理页 (`AdminUsers`)
    -   `/admin/reports`: 管理员报告页 (`AdminReports`)
    -   `/admin/settings`: 管理员设置页 (`AdminSettings`)

## 9. (可选) 部署说明 (Deployment Notes)

-   **后端:**
    -   编译 Go 应用为可执行文件: `go build -o your_app_name main.go`
    -   将可执行文件、`app.env` (配置为生产环境) 和 `static` 文件夹部署到服务器。
    -   使用进程管理器 (如 systemd, Supervisor) 运行后端服务。
-   **前端:**
    -   创建生产构建: `npm run build` (在 `frontend-react` 目录下)
    -   将 `frontend-react/build` 目录下的静态文件部署到 Web 服务器 (如 Nginx, Apache) 或静态站点托管服务。
    -   配置 Web 服务器以正确处理客户端路由 (例如，将所有未匹配的请求重定向到 `index.html`)。

## 10. (可选) 贡献指南 (Contributing)

欢迎对本项目进行贡献！请遵循以下基本准则：

1.  Fork 本仓库。
2.  基于 `main` (或当前开发分支) 创建新的特性分支 (`git checkout -b feature/your-feature-name`)。
3.  进行代码更改和提交。
4.  确保所有测试通过。
5.  发起 Pull Request 到原始仓库的 `main` 分支，并清晰描述您的更改。

---

本文档旨在提供对项目全面的理解，如有任何不明确之处或需进一步信息，请查阅相关代码或联系项目维护者。
