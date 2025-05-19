import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, deleteCategory } from '../../store/slices/categorySlice';
import CategoryForm from './CategoryForm';
import './Categories.css';

const AdminCategories = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(state => state.categories);
  
  const [showForm, setShowForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  
  const handleAddNew = () => {
    setCurrentCategory(null);
    setShowForm(true);
  };
  
  const handleEdit = (category) => {
    setCurrentCategory(category);
    setShowForm(true);
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch(deleteCategory(id));
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentCategory(null);
  };
  
  // Filter categories
  const getFilteredCategories = () => {
    if (!searchTerm.trim()) {
      return categories;
    }
    
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Count products in category (placeholder - actual implementation would use a count from the API)
  const getProductCount = (categoryId) => {
    // This is a placeholder function - in a real application, 
    // this would be a count from the API or derived from the products state
    return Math.floor(Math.random() * 50);  // Random number for demo
  };
  
  return (
    <div className="admin-categories">
      <div className="page-header">
        <h1>Categories</h1>
        <button 
          className="add-new-btn"
          onClick={handleAddNew}
        >
          <i className="fas fa-plus"></i> Add New Category
        </button>
      </div>
      
      <div className="filters-bar">
        <div className="search-box">
          <input 
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading categories...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : (
        <div className="categories-grid">
          {getFilteredCategories().map(category => (
            <div key={category.id} className="category-card">
              <div className="category-image">
                <img 
                  src={category.imageUrl || 'https://via.placeholder.com/120'} 
                  alt={category.name} 
                />
              </div>
              <div className="category-content">
                <h2>{category.name}</h2>
                <p className="category-description">
                  {category.description || 'No description available'}
                </p>
                <div className="category-stats">
                  <span className="product-count">
                    <i className="fas fa-box"></i> {getProductCount(category.id)} products
                  </span>
                </div>
                <div className="category-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(category)}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(category.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash-alt"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {getFilteredCategories().length === 0 && (
            <div className="no-results">
              No categories found.
            </div>
          )}
        </div>
      )}
      
      {showForm && (
        <CategoryForm 
          category={currentCategory}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default AdminCategories;
