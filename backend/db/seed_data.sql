-- Sample seed data for the enhanced e-commerce database

-- Insert categories with enhanced fields
INSERT INTO categories (name, description, icon, image, display_order, parent_id, is_featured)
VALUES
('Electronics', 'Electronic devices and gadgets', 'fa-microchip', 'electronics.jpg', 1, NULL, TRUE),
('Smartphones', 'Mobile phones and accessories', 'fa-mobile-alt', 'smartphones.jpg', 1, 1, TRUE),
('Laptops', 'Portable computers and accessories', 'fa-laptop', 'laptops.jpg', 2, 1, FALSE),
('Clothing', 'Apparel and fashion items', 'fa-tshirt', 'clothing.jpg', 2, NULL, TRUE),
('Men', 'Men\'s clothing and accessories', 'fa-male', 'men.jpg', 1, 4, TRUE),
('Women', 'Women\'s clothing and accessories', 'fa-female', 'women.jpg', 2, 4, TRUE),
('Books', 'Books and publications', 'fa-book', 'books.jpg', 3, NULL, FALSE),
('Fiction', 'Fictional novels and stories', 'fa-book-open', 'fiction.jpg', 1, 7, FALSE),
('Non-fiction', 'Educational and informational books', 'fa-graduation-cap', 'non-fiction.jpg', 2, 7, FALSE),
('Home & Kitchen', 'Household and kitchen items', 'fa-home', 'home.jpg', 4, NULL, TRUE);

-- Insert products with image support and enhanced fields
INSERT INTO products (name, description, price, discount_price, stock_quantity, category_id, image_main, images_gallery, sku, is_featured, is_active, tags)
VALUES
('iPhone 14 Pro', 'Latest Apple smartphone with advanced features', 999.99, 949.99, 50, 2, 'iphone14pro.jpg', '["iphone14pro_1.jpg", "iphone14pro_2.jpg", "iphone14pro_3.jpg"]', 'APL-IP14P-128', TRUE, TRUE, 'apple,smartphone,ios'),
('Samsung Galaxy S22', 'Premium Android smartphone with high-resolution camera', 899.99, 849.99, 45, 2, 'galaxy_s22.jpg', '["galaxy_s22_1.jpg", "galaxy_s22_2.jpg"]', 'SAM-GS22-256', TRUE, TRUE, 'samsung,smartphone,android'),
('MacBook Pro 16"', 'Powerful laptop for professionals with M2 Pro chip', 2499.99, 2299.99, 20, 3, 'macbook_pro_16.jpg', '["macbook_pro_16_1.jpg", "macbook_pro_16_2.jpg"]', 'APL-MBP16-1TB', TRUE, TRUE, 'apple,laptop,macOS'),
('Dell XPS 15', 'Premium Windows laptop with 4K display', 1899.99, 1799.99, 15, 3, 'dell_xps_15.jpg', '["dell_xps_15_1.jpg", "dell_xps_15_2.jpg"]', 'DEL-XPS15-1TB', FALSE, TRUE, 'dell,laptop,windows'),
('Men\'s Classic Fit Shirt', 'Comfortable cotton shirt for casual and formal occasions', 49.99, 39.99, 100, 5, 'mens_shirt.jpg', '["mens_shirt_blue.jpg", "mens_shirt_white.jpg", "mens_shirt_black.jpg"]', 'APP-MS-M-BLU', FALSE, TRUE, 'men,shirt,cotton,casual'),
('Women\'s Summer Dress', 'Lightweight floral dress perfect for summer', 79.99, 59.99, 80, 6, 'summer_dress.jpg', '["summer_dress_1.jpg", "summer_dress_2.jpg"]', 'APP-WD-S-FLR', TRUE, TRUE, 'women,dress,summer,floral'),
('The Great Gatsby', 'Classic novel by F. Scott Fitzgerald', 14.99, 12.99, 200, 8, 'great_gatsby.jpg', '["great_gatsby_1.jpg"]', 'BK-FIC-GATS', FALSE, TRUE, 'fiction,classic,gatsby'),
('Thinking, Fast and Slow', 'Bestselling psychology book by Daniel Kahneman', 18.99, 16.99, 150, 9, 'thinking_fast_slow.jpg', '["thinking_fast_slow_1.jpg"]', 'BK-NF-TFAS', FALSE, TRUE, 'non-fiction,psychology,thinking'),
('Stainless Steel Cookware Set', 'Professional-grade 10-piece cookware set', 249.99, 199.99, 30, 10, 'cookware_set.jpg', '["cookware_set_1.jpg", "cookware_set_2.jpg", "cookware_set_3.jpg"]', 'KIT-SS-10PC', TRUE, TRUE, 'kitchen,cookware,stainless-steel'),
('Smart LED TV 55"', '4K Ultra HD Smart LED TV with voice control', 699.99, 599.99, 25, 1, 'smart_tv.jpg', '["smart_tv_1.jpg", "smart_tv_2.jpg"]', 'ELC-TV-55-4K', TRUE, TRUE, 'electronics,tv,smart,4k');

-- Add some reviews
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_approved)
VALUES
(1, 1, 5, 'Amazing Phone!', 'This is the best smartphone I\'ve ever owned. Camera quality is superb!', TRUE),
(1, 2, 4, 'Great but pricey', 'Excellent phone but a bit expensive compared to competitors.', TRUE),
(3, 1, 5, 'Perfect for work', 'The MacBook Pro is incredibly fast and the battery lasts all day.', TRUE),
(6, 3, 5, 'Beautiful dress', 'Fits perfectly and the material is high quality.', TRUE),
(9, 2, 4, 'Good quality cookware', 'Heats evenly and cleans easily. Would recommend.', TRUE);

-- Add some cart items
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES
(1, 2, 1),
(1, 5, 2),
(2, 3, 1),
(3, 6, 1),
(3, 9, 1);

-- Add some wishlist items
INSERT INTO wishlist (user_id, product_id)
VALUES
(1, 3),
(1, 9),
(2, 6),
(2, 10),
(3, 2);
