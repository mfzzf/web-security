import React from 'react';
import { Link } from 'react-router-dom';
import { getImagePlaceholder } from '../utils/imagePlaceholder';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart }) => {
  // Handle image error - replace with placeholder
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = getImagePlaceholder(product.name, 300, 300, 'f0f0f0', '333333');
  };

  // Format price with appropriate decimals
  const formatPrice = (price) => {
    return price?.toFixed(2) || '0.00';
  };

  const isOutOfStock = product.stock_quantity <= 0 || !product.is_active;

  return (
    <div className="modern-product-card">
      {/* Badge for sale items */}
      {product.discount_price && (
        <div className="product-badge">
          {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
        </div>
      )}
      
      {/* Product image with hover effect */}
      <div className="product-image-container">
        <Link to={`/products/${product.id}`}>
          <img
            src={product.image_main ? `http://127.0.0.1:8080/product-images/${product.image_main}` : getImagePlaceholder(product.name, 300, 300, 'f0f0f0', '333333')}
            alt={product.name}
            className="product-image"
            onError={handleImageError}
          />
        </Link>
        
        {/* Quick action buttons */}
        <div className="product-quick-actions">
          <Link to={`/products/${product.id}`} className="quick-view-btn" title="View Details">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
          <button 
            className="quick-cart-btn" 
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Product information */}
      <div className="product-info">
        <h3 className="product-title">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <div className="price-container">
          {product.discount_price ? (
            <>
              <span className="original-price">${formatPrice(product.price)}</span>
              <span className="current-price">${formatPrice(product.discount_price)}</span>
            </>
          ) : (
            <span className="current-price">${formatPrice(product.price)}</span>
          )}
        </div>
        
        {/* Main action buttons */}
        <div className="product-action-buttons">
          <Link to={`/products/${product.id}`} className="view-details-btn">
            View Details
          </Link>
          <button 
            className="add-to-cart-btn" 
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
