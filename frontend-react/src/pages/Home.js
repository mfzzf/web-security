import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../store/slices/categorySlice';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/ProductCard';
import { addToCart } from '../store/slices/cartSlice';
import { getImagePlaceholder } from '../utils/imagePlaceholder';
import { toast } from 'react-toastify';
import './Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading: productsLoading } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);

  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '' });

  useEffect(() => {
    dispatch(fetchProducts());
    // Fetch regular categories
    dispatch(fetchCategories());
    
    // Fetch featured categories specifically
    dispatch(fetchCategories({ isFeatured: true }))
      .unwrap()
      .then(data => {
        setFeaturedCategories(data);
      })
      .catch(error => {
        console.error('Failed to fetch featured categories:', error);
      });
  }, [dispatch]);

  // Get featured products (those with is_featured flag)
  const featuredProducts = products.filter(product => product.is_featured).slice(0, 4);
  
  const handleAddToCart = (product) => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.discount_price || product.price,
      originalPrice: product.discount_price ? product.price : null,
      imageUrl: product.image_main ? `http://47.97.51.174:2808/product-images/${product.image_main}` : getImagePlaceholder(product.name, 150, 150),
      sku: product.sku,
      quantity: 1
    }));
    
    // Show notification
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to E-Shop</h1>
          <p>Discover the best products at the best prices</p>
          <Link to="/products" className="hero-btn">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products-section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products" className="view-all">
            View All
          </Link>
        </div>
        {productsLoading ? (
          <div className="loading">Loading featured products...</div>
        ) : (
          <div className="modern-products-grid">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <p>No featured products available.</p>
            )}
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <Link to="/categories" className="view-all">
            View All
          </Link>
        </div>
        {categoriesLoading ? (
          <div className="loading">Loading categories...</div>
        ) : (
          <div className="categories-grid">
            {categories.length > 0 ? (
              categories.slice(0, 4).map((category) => (
                <div className="category-card" key={category.id}>
                  <div className="category-image">
                    <img 
                      src={category.image ? `http://47.97.51.174:2808/category-images/${category.image}` : getImagePlaceholder(category.name, 150, 150, 'eeeeee', '333333')} 
                      alt={category.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getImagePlaceholder(category.name, 150, 150, 'eeeeee', '333333');
                      }}
                    />
                  </div>
                  <h3>{category.name}</h3>
                  <Link to={`/products?category=${category.id}`} className="category-btn">
                    Browse Products
                  </Link>
                </div>
              ))
            ) : (
              <p>No categories available.</p>
            )}
          </div>
        )}
      </section>

      {/* Special Offers */}
      <section className="special-offers">
        <div className="offers-banner">
          <div className="offer-content">
            <h2>Special Sale</h2>
            <p>Get up to 50% off on selected items</p>
            <Link to="/products?sale=true" className="offer-btn">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="newsletter">
        <div className="newsletter-content">
          <h2>Subscribe to Our Newsletter</h2>
          <p>Get the latest updates on new products and special promotions</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Your email address" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
