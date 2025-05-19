import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder, createPaymentSession } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { getImagePlaceholder } from '../utils/imagePlaceholder';
import './Checkout.css';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { items, totalAmount } = useSelector(state => state.cart);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { loading, order, paymentSession, paymentLoading } = useSelector(state => state.orders);
  
  // Form state for shipping information
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    paymentMethod: 'stripe',
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Redirect if cart is empty or user is not authenticated
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [items, isAuthenticated, navigate]);
  
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
    
    // Check required fields
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if user is authenticated and user object exists
    if (!isAuthenticated || !user) {
      console.log('User not authenticated or user object is null:', { isAuthenticated, user });
      // Redirect to login if user is not authenticated
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    // Debug authentication token
    const token = localStorage.getItem('accessToken');
    console.log('Authentication token exists:', !!token);
    if (!token) {
      console.error('Missing authentication token');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    // Prepare shipping address format for backend
    const formattedAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
    
    // Prepare order data
    const orderData = {
      user_id: user.id,
      shipping_address: formattedAddress,
      items: items.map(item => ({
        // 使用产品ID而不是购物车项ID
        product_id: item.product_id || item.productId || item.id,
        quantity: item.quantity
      }))
    };
    
    console.log('Submitting order data:', orderData);
    
    // Create order and proceed to payment
    dispatch(createOrder(orderData))
      .then((result) => {
        console.log('Order creation result:', result);
        if (result.error) {
          console.error('Order creation error:', result.error);
          let errorMessage = 'Unknown error';
          if (typeof result.error === 'object') {
            errorMessage = JSON.stringify(result.error);
          } else if (typeof result.error === 'string') {
            errorMessage = result.error;
          }
          alert(`Failed to create order: ${errorMessage}`);
          return;
        }
        
        // Create Stripe payment session for the order
        // 使用order_id而不是id字段，因为后端返回的是order_id
        dispatch(createPaymentSession(result.payload.order_id))
          .then((paymentResult) => {
            console.log('Payment session result:', paymentResult);
            if (paymentResult.error) {
              console.error('Payment session error:', paymentResult.error);
              alert(`Failed to create payment session: ${paymentResult.error}`);
              return;
            }
            
            // Clear cart after successful order
            dispatch(clearCart());
            // Redirect to Stripe checkout
            window.location.href = paymentResult.payload.payment_url;
          })
          .catch(err => {
            console.error('Payment session creation failed:', err);
            alert('Failed to set up payment. Please try again.');
          });
      })
      .catch(err => {
        console.error('Order creation failed:', err);
        alert('Failed to create order. Please try again.');
      });
  };
  
  // Calculate order summary
  const shipping = 0; // Free shipping for now
  const tax = totalAmount * 0.05; // 5% tax
  const orderTotal = totalAmount + shipping + tax;
  
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      <div className="checkout-content">
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Shipping Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name*</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <div className="error-message">{errors.fullName}</div>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number*</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <div className="error-message">{errors.phone}</div>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address">Address*</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <div className="error-message">{errors.address}</div>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City*</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <div className="error-message">{errors.city}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="state">State/Province*</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={errors.state ? 'error' : ''}
                  />
                  {errors.state && <div className="error-message">{errors.state}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP/Postal Code*</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={errors.zipCode ? 'error' : ''}
                  />
                  {errors.zipCode && <div className="error-message">{errors.zipCode}</div>}
                </div>
              </div>
            </div>
            
            <div className="payment-methods">
              <h3>Payment Method</h3>
              <div className="payment-description">
                <p>Your payment will be securely processed by Stripe.</p>
                <div className="stripe-logo">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" />
                </div>
                <p className="payment-info">After confirming your order, you'll be redirected to Stripe's secure payment page to complete your purchase.</p>
              </div>
            </div>
            
            <div className="checkout-actions">
              <button 
                type="button" 
                className="back-to-cart-btn"
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </button>
              <button 
                type="submit" 
                className="place-order-btn"
                disabled={loading || paymentLoading}
              >
                {loading || paymentLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          <div className="order-items">
            {items.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="item-image">
                  <img 
                    src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/80'}
                    alt={item.name} 
                  />
                  <span className="item-quantity">{item.quantity}</span>
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <div className="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-calculations">
            <div className="calc-row">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="calc-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="calc-row">
              <span>Tax (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="calc-row total">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
