import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { updateQuantity, removeFromCart, clearCart, fetchCart } from '../store/slices/cartSlice';
import './Cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items = [], totalAmount = 0, status, error } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // 组件挂载时获取最新的购物车数据
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    console.log('Cart page useEffect - Token present:', !!token);
    
    // 只有当有token存在时才发送请求
    if (token) {
      console.log('Cart page - Dispatching fetchCart');
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);
  
  // 添加调试日志查看购物车数据
  console.log('Cart page rendered with data:', { items, totalAmount, status, error });

  const handleQuantityChange = (id, quantity) => {
    // 确保数量始终为正整数
    const validQuantity = Math.max(1, quantity);
    dispatch(updateQuantity({ id, quantity: validQuantity }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  return (
    <div className="cart-container">
      <h1>Your Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-message">
            <i className="fas fa-shopping-cart"></i>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/products" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-container">
            <div className="cart-header">
              <div className="cart-header-product">Product</div>
              <div className="cart-header-price">Price</div>
              <div className="cart-header-quantity">Quantity</div>
              <div className="cart-header-total">Total</div>
              <div className="cart-header-actions">Actions</div>
            </div>

            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-product">
                  <div className="cart-item-image">
                    <img 
                      src={item.imageUrl ? `http://47.97.51.174:2808${item.imageUrl}` : 'https://via.placeholder.com/80'} 
                      alt={item.name} 
                    />
                  </div>
                  <div className="cart-item-details">
                    <h3>
                      <Link to={`/products/${item.id}`}>{item.name}</Link>
                    </h3>
                  </div>
                </div>

                <div className="cart-item-price">${(typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)).toFixed(2)}</div>

                <div className="cart-item-quantity">
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                      min="1"
                    />
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  ${item.totalPrice ? (typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice).toFixed(2) : ((typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)) * (item.quantity || 0)).toFixed(2)}
                </div>

                <div className="cart-item-actions">
                  <button 
                    className="delete-item-btn"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <i className="fa fa-trash"></i>Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${(typeof totalAmount === 'string' ? parseFloat(totalAmount) : (totalAmount || 0)).toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>${(typeof totalAmount === 'string' ? parseFloat(totalAmount) : (totalAmount || 0)).toFixed(2)}</span>
            </div>
            
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
            
            <div className="cart-actions">
              <Link to="/products" className="continue-shopping-link">
                Continue Shopping
              </Link>
              <button 
                className="clear-cart-btn"
                onClick={handleClearCart}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
