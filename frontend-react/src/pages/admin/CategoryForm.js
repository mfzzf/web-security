import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createCategory, updateCategory } from '../../store/slices/categorySlice';
import './CategoryForm.css';

const CategoryForm = ({ category, onClose }) => {
  const dispatch = useDispatch();
  const isEditing = !!category;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        imageUrl: category.imageUrl || ''
      });
    }
  }, [category]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing) {
        await dispatch(updateCategory({ id: category.id, categoryData: formData }));
      } else {
        await dispatch(createCategory(formData));
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="category-form-overlay">
      <div className="category-form-container">
        <div className="form-header">
          <h2>{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            disabled={loading}
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Category Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              disabled={loading}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              disabled={loading}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              disabled={loading}
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
