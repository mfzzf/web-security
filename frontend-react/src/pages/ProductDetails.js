import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState('');
  
  const { product, loading, error } = useSelector(state => state.products);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);
  
  // Set the main image when product data loads
  useEffect(() => {
    if (product && product.image_main) {
      setCurrentImage(product.image_main);
    }
  }, [product]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        price: product.discount_price || product.price,
        originalPrice: product.discount_price ? product.price : null,
        imageUrl: product.image_main ? `http://47.97.51.174:2808/product-images/${product.image_main}` : `https://via.placeholder.com/400x300/eeeeee/333333?text=${encodeURIComponent(product.name)}`,
        sku: product.sku,
        quantity
      }));
      // Show notification
      toast.success(`${product.name} added to cart!`);
    }
  };
  
  const handleThumbnailClick = (image) => {
    setCurrentImage(image);
  };
  
  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };
  
  if (loading) {
    return <div className="product-details-loading">Loading product details...</div>;
  }
  
  if (error) {
    return <div className="product-details-error">Error: {error}</div>;
  }
  
  if (!product) {
    return <div className="product-details-not-found">Product not found</div>;
  }
  
  return (
    <div className="product-details-container">
      <div className="product-details-grid">
        <div className="product-details-image">
          {/* Main product image */}
          <img 
            src={currentImage ? `http://47.97.51.174:2808/product-images/${currentImage}` : `https://via.placeholder.com/400x300/eeeeee/333333?text=${encodeURIComponent(product.name)}`} 
            alt={product.name} 
            className="main-product-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://via.placeholder.com/400x300/eeeeee/333333?text=${encodeURIComponent(product.name)}`;
            }}
          />
          
          {/* Image gallery thumbnails */}
          {product.images_gallery && (
            <div className="product-image-gallery">
              {/* Add main image as first thumbnail */}
              <div 
                className={`gallery-thumbnail ${currentImage === product.image_main ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(product.image_main)}
              >
                <img 
                  src={`http://47.97.51.174:2808/product-images/${product.image_main}`} 
                  alt={`${product.name} main view`} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/100x80/eeeeee/333333?text=Main`;
                  }}
                />
              </div>
              
              {/* Add additional gallery images */}
              {JSON.parse(product.images_gallery).map((img, index) => (
                <div 
                  key={index} 
                  className={`gallery-thumbnail ${currentImage === img ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(img)}
                >
                  <img 
                    src={`http://47.97.51.174:2808/product-images/${img}`} 
                    alt={`${product.name} view ${index + 1}`} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/100x80/eeeeee/333333?text=View ${index + 1}`;
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="product-details-info">
          <h1>{product.name}</h1>
          
          <div className="product-details-price">
            {product.discount_price ? (
              <div className="product-discount">
                <span className="original-price">${product.price?.toFixed(2)}</span>
                <span className="current-price">${product.discount_price?.toFixed(2)}</span>
                <span className="discount-percent">
                  Save {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                </span>
              </div>
            ) : (
              <span className="current-price">${product.price?.toFixed(2)}</span>
            )}
          </div>
          
          <div className="product-availability">
            <span className={product.stock_quantity > 0 && product.is_active ? 'in-stock' : 'out-of-stock'}>
              {product.stock_quantity > 0 && product.is_active
                ? `In Stock (${product.stock_quantity} available)`
                : 'Out of Stock'}
            </span>
          </div>
          
          {/* Product SKU */}
          {product.sku && (
            <div className="product-sku">
              SKU: <span>{product.sku}</span>
            </div>
          )}
          
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          
          {product.stock_quantity > 0 && product.is_active && (
            <div className="product-actions">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={handleQuantityChange}
                />
              </div>
              
              <div className="action-buttons">
                <button 
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
                <button 
                  className="buy-now-btn"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </button>
              </div>
            </div>
          )}
          
          {(!product.stock_quantity || !product.is_active) && (
            <button className="notify-btn">
              Notify When Available
            </button>
          )}
        </div>
      </div>
      
      {/* Tags section */}
      {product.tags && (
        <div className="product-tags">
          <h3>Tags</h3>
          <div className="tags-container">
            {product.tags.split(',').map((tag, index) => (
              <span key={index} className="tag">{tag.trim()}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Related products would go here */}
      
      {/* Reviews section placeholder */}
      <div className="product-reviews">
        <h3>Customer Reviews</h3>
        <div className="reviews-container">
          <p>Reviews coming soon</p>
        </div>
      </div>
      
      {/* Additional sections like reviews can be added here */}
    </div>
  );
};

export default ProductDetails;
