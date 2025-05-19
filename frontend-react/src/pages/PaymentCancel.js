import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchOrderById } from '../store/slices/orderSlice';
import './PaymentResult.css';

const PaymentCancel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get the order ID from the URL query parameters
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderID');
    
    if (orderId) {
      // Fetch order details
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, location]);
  
  const handleRetryPayment = () => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderID');
    
    if (orderId) {
      navigate(`/checkout/payment/${orderId}`);
    } else {
      navigate('/cart');
    }
  };
  
  const handleBackToCart = () => {
    navigate('/cart');
  };
  
  return (
    <div className="payment-result-container">
      <div className="payment-result-card cancel">
        <div className="result-icon cancel">
          <i className="fas fa-times-circle"></i>
        </div>
        
        <h1>Payment Cancelled</h1>
        <p>Your payment has been cancelled. No charges were made.</p>
        
        <div className="action-buttons">
          <button 
            className="secondary-button" 
            onClick={handleBackToCart}
          >
            Back to Cart
          </button>
          <button 
            className="primary-button" 
            onClick={handleRetryPayment}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
