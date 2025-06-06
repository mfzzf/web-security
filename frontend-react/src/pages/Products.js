import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { addToCart } from '../store/slices/cartSlice';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-toastify';
import './Products.css';

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { products, loading: productsLoading } = useSelector(state => state.products);
  const { categories, loading: categoriesLoading } = useSelector(state => state.categories);
  
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    search: searchParams.get('search') || '',
    sortBy: 'default',
  });
  
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // 调试输出
  useEffect(() => {
    console.log('Categories data:', categories);
  }, [categories]);
  
  useEffect(() => {
    if (products.length > 0) {
      let results = [...products];
      
      // Apply search filter
      if (filters.search) {
        results = results.filter(product => 
          product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      // Apply category filter
      if (filters.category) {
        // 构建一个包含父类别及其所有子类别的ID集合
        const categoryIds = new Set([filters.category]);
        
        // 如果选中的是父类别，需要查找其所有子类别
        if (categories.length > 0) {
          // 首先找到选中的类别
          const selectedCategoryId = parseInt(filters.category, 10);
          
          // 查找所有子类别
          categories.forEach(cat => {
            if (cat.parent_id && cat.parent_id === selectedCategoryId) {
              categoryIds.add(String(cat.id));
            }
          });
        }
        
        console.log('Included category IDs:', [...categoryIds]);
        
        results = results.filter(product => {
          // 处理字段名称差异和类型转换
          const productCategoryId = product.categoryId || product.category_id;
          const productCategoryIdStr = String(productCategoryId);
          
          // 如果产品的类别ID在我们的包含集合中，则包含该产品
          return categoryIds.has(productCategoryIdStr);
        });
      }
      
      // Apply price filters
      if (filters.minPrice) {
        results = results.filter(product => product.price >= parseFloat(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        results = results.filter(product => product.price <= parseFloat(filters.maxPrice));
      }
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'price-low-high':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price-high-low':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'name-a-z':
          results.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-z-a':
          results.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          // Default sorting (newest first based on ID)
          results.sort((a, b) => b.id - a.id);
      }
      
      setFilteredProducts(results);
    }
  }, [products, filters]);
  
  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    
    setSearchParams(params);
  }, [filters.search, filters.category, setSearchParams]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sortBy: 'default',
    });
  };
  
  const handleAddToCart = (product) => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.discount_price || product.price,
      originalPrice: product.discount_price ? product.price : null,
      imageUrl: product.image_main ? `http://47.97.51.174:2808/product-images/${product.image_main}` : 'https://via.placeholder.com/150',
      sku: product.sku,
      quantity: 1
    }));
    
    // 显示添加到购物车的通知
    toast.success(
      <div className="cart-toast-content">
        <span>已添加到购物车</span>
        <strong>{product.name}</strong>
        <span className="toast-price">￥{(product.discount_price || product.price).toFixed(2)}</span>
      </div>, 
      {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      }
    );
  };
  
  return (
    <div className="products-page-container">
      <h1>All Products</h1>
      
      <div className="products-grid-container">
        <div className="filters-sidebar">
          <div className="filter-section">
            <h3>Filters</h3>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>
          
          <div className="filter-section">
            <h4>Categories</h4>
            {categoriesLoading ? (
              <p>Loading categories...</p>
            ) : categories.length > 0 ? (
              <div className="category-filters">
                <div className="category-option">
                  <input
                    type="radio"
                    id="all-categories"
                    name="category"
                    value=""
                    checked={filters.category === ''}
                    onChange={handleFilterChange}
                  />
                  <label htmlFor="all-categories">All Categories</label>
                </div>
                
                {/* 获取根类别 */}
                {(() => {
                  // 首先构建所有类别的映射，以便找出父子关系
                  const categoryMap = new Map();
                  const rootCategories = [];
                  
                  // 第一步：填充映射
                  categories.forEach(cat => {
                    categoryMap.set(cat.id, {
                      ...cat,
                      children: []
                    });
                  });
                  
                  // 第二步：构建层次结构
                  categories.forEach(cat => {
                    const catId = cat.id;
                    const parentId = cat.parent_id;
                    
                    // 如果没有parent_id或parent_id为null，则为根类别
                    if (!parentId) {
                      rootCategories.push(categoryMap.get(catId));
                    } else if (categoryMap.has(parentId)) {
                      // 如果有父类别，则将当前类别添加为其子类别
                      categoryMap.get(parentId).children.push(categoryMap.get(catId));
                    }
                  });
                  
                  // 第三步：按显示顺序排序
                  rootCategories.sort((a, b) => a.display_order - b.display_order);
                  
                  // 第四步：渲染类别树
                  return rootCategories.map(rootCat => (
                    <div key={rootCat.id} className="category-group">
                      <div className="category-option">
                        <input
                          type="radio"
                          id={`category-${rootCat.id}`}
                          name="category"
                          value={rootCat.id}
                          checked={filters.category === rootCat.id.toString()}
                          onChange={handleFilterChange}
                        />
                        {rootCat.icon && <i className={`category-icon fas ${rootCat.icon}`}></i>}
                        <label htmlFor={`category-${rootCat.id}`}>{rootCat.name}</label>
                        {rootCat.is_featured && <span className="featured-badge">Featured</span>}
                      </div>
                      
                      {/* 子类别 */}
                      {rootCat.children.length > 0 && (
                        <div className="subcategory-list">
                          {rootCat.children
                            .sort((a, b) => a.display_order - b.display_order)
                            .map(childCat => (
                              <div className="subcategory-option" key={childCat.id}>
                                <input
                                  type="radio"
                                  id={`category-${childCat.id}`}
                                  name="category"
                                  value={childCat.id}
                                  checked={filters.category === childCat.id.toString()}
                                  onChange={handleFilterChange}
                                />
                                {childCat.icon && <i className={`category-icon fas ${childCat.icon}`}></i>}
                                <label htmlFor={`category-${childCat.id}`}>{childCat.name}</label>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  ));
                })()} 
              </div>
            ) : (
              <p>No categories available</p>
            )}
          </div>
          
          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="price-range">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
              <span>to</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          <div className="filter-section">
            <h4>Sort By</h4>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="sort-select"
            >
              <option value="default">Newest First</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="name-a-z">Name: A to Z</option>
              <option value="name-z-a">Name: Z to A</option>
            </select>
          </div>
        </div>
        
        <div className="products-main-content">
          <div className="search-and-results">
            <div className="products-search">
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="results-count">
              Showing {filteredProducts.length} products
            </div>
          </div>
          
          {productsLoading ? (
            <div className="products-loading">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="modern-products-grid">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="no-products-found">
              <p>No products match your filters.</p>
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
