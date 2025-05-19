import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrders, updateOrderStatus } from '../../store/slices/orderSlice';
import './Orders.css';

const AdminOrders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    // In a real app, this would fetch all orders (not just for a specific user)
    // This is a placeholder using the existing user orders function
    dispatch(fetchUserOrders('all'));
  }, [dispatch]);
  
  // Filter and sort orders
  const getFilteredOrders = () => {
    // Apply search filter
    let results = [...orders];
    
    if (searchTerm) {
      results = results.filter(order => 
        order.id?.toString().includes(searchTerm) ||
        order.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(order => order.status === statusFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'total-high':
        results.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'total-low':
        results.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return results;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle status change
  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
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
    <div className="admin-orders">
      <div className="page-header">
        <h1>Orders</h1>
      </div>
      
      <div className="filters-bar">
        <div className="search-box">
          <input 
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="sort-box">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total-high">Total (High to Low)</option>
            <option value="total-low">Total (Low to High)</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredOrders().map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.shippingAddress?.fullName || 'N/A'}</td>
                  <td>${order.totalAmount?.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-dropdown">
                      <button className="view-details-btn">
                        <i className="fas fa-eye"></i> View
                      </button>
                      <div className="status-dropdown">
                        <button className="status-btn">
                          Update Status <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="status-options">
                          <button 
                            onClick={() => handleStatusChange(order.id, 'processing')}
                            className={order.status === 'processing' ? 'active' : ''}
                          >
                            Processing
                          </button>
                          <button 
                            onClick={() => handleStatusChange(order.id, 'shipped')}
                            className={order.status === 'shipped' ? 'active' : ''}
                          >
                            Shipped
                          </button>
                          <button 
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                            className={order.status === 'delivered' ? 'active' : ''}
                          >
                            Delivered
                          </button>
                          <button 
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            className={order.status === 'cancelled' ? 'active' : ''}
                          >
                            Cancelled
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              
              {getFilteredOrders().length === 0 && (
                <tr>
                  <td colSpan="6" className="no-results">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
