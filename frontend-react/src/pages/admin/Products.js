import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import ProductForm from './ProductForm';
import './Products.css';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector(state => state.products);
  const { categories } = useSelector(state => state.categories);
  
  const [showForm, setShowForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);
  
  const handleAddNew = () => {
    setCurrentProduct(null);
    setShowForm(true);
  };
  
  const handleEdit = (product) => {
    setCurrentProduct(product);
    setShowForm(true);
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProduct(id));
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentProduct(null);
  };
  
  // Filter and sort products
  const getFilteredProducts = () => {
    // Apply search filter
    let results = [...products];
    
    if (searchTerm) {
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      results = results.filter(product => product.category_id === Number(categoryFilter));
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        results.sort((a, b) => a.id - b.id);
        break;
      case 'newest':
      default:
        results.sort((a, b) => b.id - a.id);
    }
    
    return results;
  };
  
  // Find category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };
  
  return (
    <div className="admin-products">
      <div className="page-header">
        <h1>Products</h1>
        <button 
          className="add-new-btn"
          onClick={handleAddNew}
        >
          <i className="fas fa-plus"></i> Add New Product
        </button>
      </div>
      
      <div className="filters-bar">
        <div className="search-box">
          <input 
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="sort-box">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-low">Price (Low to High)</option>
            <option value="price-high">Price (High to Low)</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredProducts().map(product => (
                <tr key={product.id}>
                  <td className="product-image-cell">
                    <img 
                      src={product.image_main ? `http://127.0.0.1:8080/product-images/${product.image_main}` : 'https://via.placeholder.com/60'} 
                      alt={product.name} 
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{getCategoryName(product.category_id)}</td>
                  <td>${product.price?.toFixed(2)}</td>
                  <td>
                    {product.stock_quantity !== undefined ? (
                      <span className={product.stock_quantity < 10 ? 'low-stock' : ''}>
                        {product.stock_quantity}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <span className={`status ${product.stock_quantity > 0 && product.is_active ? 'in-stock' : 'out-of-stock'}`}>
                      {product.stock_quantity > 0 && product.is_active ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(product)}
                      title="Edit"
                    >
                      <i className="fas fa-edit" aria-hidden="true"></i>
                      <span className="btn-label">Edit</span>
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(product.id)}
                      title="Delete"
                    >
                      <i className="fas fa-trash-alt" aria-hidden="true"></i>
                      <span className="btn-label">Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              
              {getFilteredProducts().length === 0 && (
                <tr>
                  <td colSpan="7" className="no-results">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {showForm && (
        <ProductForm 
          product={currentProduct}
          categories={categories}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default AdminProducts;
