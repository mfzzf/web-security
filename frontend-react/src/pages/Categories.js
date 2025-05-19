import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../store/slices/categorySlice';
import './Categories.css'; // 可能需要创建对应的CSS文件

const Categories = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(state => state.categories);
  
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  
  if (loading) {
    return <div className="categories-loading">加载商品类别中...</div>;
  }
  
  if (error) {
    return <div className="categories-error">加载出错: {error}</div>;
  }

  return (
    <div className="categories-page-container">
      <h1>所有商品类别</h1>
      
      {categories.length > 0 ? (
        <div className="categories-grid">
          {categories.map(category => (
            <div className="category-card" key={category.id}>
              <div className="category-image">
                <img 
                  src={`https://via.placeholder.com/200x150/eeeeee/333333?text=${encodeURIComponent(category.name)}`}
                  alt={category.name} 
                  className="category-thumbnail"
                />
              </div>
              <div className="category-info">
                <h3>{category.name}</h3>
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
                <Link 
                  to={`/products?category=${category.id}`} 
                  className="browse-category-btn"
                >
                  浏览商品
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-categories">
          <p>暂无商品类别</p>
        </div>
      )}
    </div>
  );
};

export default Categories;
