import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchOrderById, cancelOrder, createPaymentSession } from '../store/slices/orderSlice';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const { order, loading, error } = useSelector(state => state.orders);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${id}` } });
      return;
    }
    
    dispatch(fetchOrderById(id));
  }, [id, isAuthenticated, navigate, dispatch]);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid&processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      case 'unpaid':
        return 'status-unpaid';
      default:
        return '';
    }
  };
  
  // Handle order cancellation
  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      dispatch(cancelOrder(id))
        .then((result) => {
          if (!result.error) {
            alert('Order cancelled successfully');
            // Refresh order details
            dispatch(fetchOrderById(id));
          } else {
            alert(`Failed to cancel order: ${result.error}`);
          }
        });
    }
  };
  
  // Handle payment process
  const handlePayOrder = () => {
    dispatch(createPaymentSession(id))
      .then((result) => {
        if (!result.error) {
          const paymentUrl = result.payload.payment_url;
          if (paymentUrl) {
            // Redirect to payment page
            window.location.href = paymentUrl;
          } else {
            alert('Payment session created but no payment URL was returned');
          }
        } else {
          alert(`Failed to create payment session: ${result.error}`);
        }
      });
  };
  
  if (loading) {
    return <div className="order-details-loading">Loading order details...</div>;
  }
  
  if (error) {
    return (
      <div className="order-details-error">
        Error: {typeof error === 'string' ? error : error.message || 'Failed to load order details'}
      </div>
    );
  }
  
  if (!order) {
    return <div className="order-not-found">Order not found.</div>;
  }
  
  return (
    <div className="order-details-container">
      <div className="order-details-header">
        <h1>Order Details</h1>
        <Link to="/orders" className="back-to-orders">
          &larr; Back to My Orders
        </Link>
      </div>
      
      <div className="order-details-grid">
        <div className="order-details-main">
          <div className="order-details-card">
            <div className="order-info">
              <div className="order-info-header">
                <h2>Order #{order.id}</h2>
                <div className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status}
                </div>
              </div>
              
              <div className="order-date-tracking">
                <p>Placed on {formatDate(order.createdAt)}</p>
                {order.trackingNumber && (
                  <p className="tracking-info">
                    Tracking Number: <strong>{order.trackingNumber}</strong>
                  </p>
                )}
              </div>
            </div>
            
            <div className="order-items-list">
              <h3>Items</h3>
              {order.items?.map((item, index) => (
                <div className="order-item-detail" key={index}>
                  <div className="item-image">
                    <img 
                      src={item.product?.imageUrl ? (item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `http://47.97.51.174:2808${item.product.imageUrl}`) : 'https://via.placeholder.com/80'} 
                      alt={item.product?.name} 
                    />
                  </div>
                  <div className="item-info">
                    <h4>{item.product?.name}</h4>
                    <div className="item-meta">
                      <div className="item-price">${item.price?.toFixed(2)}</div>
                      <div className="item-quantity">Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="order-details-sidebar">
          <div className="order-details-card">
            <div className="shipping-info">
              <h3>Shipping Information</h3>
              <div className="address-info">
                <p>{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.address}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                </p>
                {/* <p>Phone: {order.shippingAddress?.phone}</p> */}
              </div>
            </div>
          </div>
          
          <div className="order-details-card">
            <div className="payment-info">
              <h3>Payment Information</h3>
              <p className="payment-method">
                Method: <strong>{order.paymentMethod}</strong>
              </p>
            </div>
          </div>
          
          <div className="order-details-card">
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${order.totalAmount?.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span>{order.shippingCost ? `$${order.shippingCost.toFixed(2)}` : 'Free'}</span>
              </div>
              
              <div className="summary-row">
                <span>Tax</span>
                <span>${order.taxAmount?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="summary-row total">
                <span>Total</span>
                <span>${order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="order-actions">
              {order.status === 'unpaid' && (
                <button 
                  className="pay-order-btn"
                  onClick={handlePayOrder}
                  disabled={loading || order.paymentLoading}
                >
                  {loading || order.paymentLoading ? 'Processing...' : 'Pay Now'}
                </button>
              )}
              
              <button 
                className="cancel-order-btn"
                onClick={handleCancelOrder}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Cancel Order'}
              </button>
              
              <button className="contact-support-btn">
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
