import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCart } from '../store/slices/cartSlice';
import './CartPopup.css';

const CartPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const dispatch = useDispatch();
  // 从Redux获取购物车状态
  const cartState = useSelector(state => state.cart);
  console.log('CartPopup - Cart state:', cartState);
  
  const { items = [], totalQuantity = 0, totalAmount = 0, status } = cartState;
  const [isAnimating, setIsAnimating] = useState(false);
  const { isAuthenticated } = useSelector(state => state.auth);
  console.log('CartPopup - isAuthenticated:', isAuthenticated);
  
  // 显示最多3个商品
  const displayItems = items?.slice(0, 3) || [];
  console.log('CartPopup - displayItems:', displayItems);
  
  // 组件挂载时获取购物车数据
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    console.log('CartPopup useEffect - Token present:', !!token);
    
    // 只有当有token存在时才发送请求
    if (token) {
      console.log('CartPopup - Dispatching fetchCart');
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);
  
  // 处理点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当添加新商品时的动画效果
  useEffect(() => {
    if (totalQuantity > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalQuantity]);

  // 格式化价格显示
  const formatPrice = (price) => {
    // 确保使用数字类型进行格式化
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return (numPrice || 0).toFixed(2);
  };
  
  console.log('Rendering cart with totalAmount:', totalAmount, 'and totalQuantity:', totalQuantity);

  return (
    <div className="cart-popup-container" ref={popupRef}>
      <div 
        className={`cart-popup-icon ${isAnimating ? 'cart-icon-animate' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        {totalQuantity > 0 && (
          <span className="cart-item-count">{totalQuantity}</span>
        )}
      </div>
      
      {isOpen && (
        <div className="cart-popup">
          <div className="cart-popup-header">
            <h4>Cart ({totalQuantity} items)</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="cart-popup-items">
            {displayItems.length > 0 ? (
              displayItems.map(item => (
                <div key={item.id} className="cart-popup-item">
                  <div className="item-image">
                    <img 
                      src={item.imageUrl ? `http://47.97.51.174:2808${item.imageUrl}` : 'https://via.placeholder.com/80'}
                      alt={item.name} 
                    />
                  </div>
                  <div className="item-details">
                    <h5>{item.name}</h5>
                    <p className="item-price">${formatPrice(item.price)} × {item.quantity || 0}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-cart-message">购物车是空的</p>
            )}
            
            {items.length > 3 && (
              <p className="more-items">还有 {items.length - 3} 件商品...</p>
            )}
          </div>
          
          {items.length > 0 && (
            <>
              <div className="cart-popup-total">
                <span>总计:</span>
                <span className="total-amount">${formatPrice(totalAmount)}</span>
              </div>
              
              <div className="cart-popup-actions">
                <Link to="/cart" className="view-cart-btn" onClick={() => setIsOpen(false)}>
                  查看购物车
                </Link>
                <Link to="/checkout" className="checkout-btn" onClick={() => setIsOpen(false)}>
                  结算
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartPopup;
