import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUserOrders } from '../store/slices/orderSlice';
import './OrderHistory.css';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useSelector(state => state.orders);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  // Filter state
  const [filter, setFilter] = useState('all'); // all, processing, shipped, delivered, cancelled
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    
    if (user) {
      dispatch(fetchUserOrders(user.id));
    }
  }, [isAuthenticated, user, navigate, dispatch]);
  
  // Get filtered orders
  const getFilteredOrders = () => {
    if (filter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status.toLowerCase() === filter);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status class
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  return (
    <div className="order-history-container">
      <h1>My Orders</h1>
      
      {loading ? (
        <div className="orders-loading">Loading orders...</div>
      ) : error ? (
        <div className="orders-error">Error: {typeof error === 'object' ? JSON.stringify(error) : error}</div>
      ) : (
        <>
          <div className="order-filters">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Orders
            </button>
            <button 
              className={filter === 'processing' ? 'active' : ''}
              onClick={() => setFilter('processing')}
            >
              Processing
            </button>
            <button 
              className={filter === 'shipped' ? 'active' : ''}
              onClick={() => setFilter('shipped')}
            >
              Shipped
            </button>
            <button 
              className={filter === 'delivered' ? 'active' : ''}
              onClick={() => setFilter('delivered')}
            >
              Delivered
            </button>
            <button 
              className={filter === 'cancelled' ? 'active' : ''}
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>
          
          {orders.length === 0 ? (
            <div className="no-orders">
              <p>You don't have any orders yet.</p>
              <Link to="/products" className="start-shopping-btn">
                Start Shopping
              </Link>
            </div>
          ) : getFilteredOrders().length === 0 ? (
            <div className="no-filtered-orders">
              <p>No {filter} orders found.</p>
              <button onClick={() => setFilter('all')} className="view-all-btn">
                View All Orders
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {getFilteredOrders().map(order => (
                <div className="order-card" key={order.id}>
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.id}</h3>
                      <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <div className={`order-status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="order-items">
                    {order.items && order.items.length > 0 ? (
                      <>
                        {order.items.slice(0, 3).map((item, index) => (
                          <div className="order-item" key={`${order.id}-${index}`}>
                            <div className="item-image">
                              <img 
                                src={item.product?.imageUrl ? (item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `http://47.97.51.174:2808${item.product.imageUrl}`) : 'https://via.placeholder.com/60'} 
                                alt={item.product?.name} 
                              />
                            </div>
                            <div className="item-details">
                              <h4>{item.product?.name}</h4>
                              <p className="item-meta">
                                Qty: {item.quantity} × ${item.price?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {order.items.length > 3 && (
                          <div className="more-items">
                            +{order.items.length - 3} more items
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="no-items-info">
                        <p>Order details unavailable</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-total">
                      Total: <span>${order.totalAmount?.toFixed(2)}</span>
                    </div>
                    <Link to={`/orders/${order.id}`} className="view-details-btn">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;
