import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkPaymentStatus, fetchOrderById } from '../store/slices/orderSlice';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  const { order, paymentStatus } = useSelector(state => state.orders);
  
  useEffect(() => {
    // Get the order ID from the URL query parameters
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderID');
    const sessionId = params.get('session_id');
    
    if (orderId) {
      // Fetch order details and payment status
      dispatch(fetchOrderById(orderId));
      dispatch(checkPaymentStatus(orderId)).then(() => {
        setIsLoading(false);
      });
    } else {
      navigate('/orders');
    }
  }, [dispatch, location, navigate]);
  
  const handleContinueShopping = () => {
    navigate('/products');
  };
  
  const handleViewOrder = () => {
    if (order?.id) {
      navigate(`/orders/${order.id}`);
    } else {
      navigate('/orders');
    }
  };
  
  if (isLoading) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card loading">
          <div className="loader"></div>
          <h2>Processing Your Payment</h2>
          <p>Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }
  
  // 获取更详细的支付状态和订单信息
  const getPaymentStatusDisplay = () => {
    // 首先尝试从payment_status获取（新后端格式）
    if (paymentStatus?.payment_status === 'paid' || paymentStatus?.payment_status === 'completed') {
      return 'Paid';
    }
    
    // 然后检查status字段（旧格式）
    if (paymentStatus?.status === 'paid') {
      return 'Paid';
    }
    
    // 最后检查订单状态
    if (order?.status === 'paid') {
      return 'Paid';
    }
    
    // 回退到order_status或默认状态
    return paymentStatus?.order_status || order?.status || 'Processing';
  };
  
  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result-card success">
        <div className="result-icon success">
          <i className="fas fa-check-circle"></i>
        </div>
        
        <h1>Payment Successful!</h1>
        <p>Your order has been placed and payment has been received.</p>
        
        {order && (
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-details">
              <div className="detail-row">
                <span>Order ID:</span>
                <span>#{order.id}</span>
              </div>
              <div className="detail-row">
                <span>Order Number:</span>
                <span>{order.order_number || '-'}</span>
              </div>
              <div className="detail-row">
                <span>Total Amount:</span>
                <span>${paymentStatus?.amount || order.totalAmount ? (paymentStatus?.amount || order.totalAmount).toFixed(2) : '0.00'}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span className="order-status paid">{getPaymentStatusDisplay()}</span>
              </div>
              {paymentStatus?.payment_method && (
                <div className="detail-row">
                  <span>Payment Method:</span>
                  <span>{paymentStatus.payment_method}</span>
                </div>
              )}
              {paymentStatus?.transaction_id && (
                <div className="detail-row">
                  <span>Transaction ID:</span>
                  <span className="transaction-id">{paymentStatus.transaction_id}</span>
                </div>
              )}
              {paymentStatus?.payment_time && (
                <div className="detail-row">
                  <span>Payment Time:</span>
                  <span>{formatDate(paymentStatus.payment_time)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            className="secondary-button" 
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </button>
          <button 
            className="primary-button" 
            onClick={handleViewOrder}
          >
            View Order Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
