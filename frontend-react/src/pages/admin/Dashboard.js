import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './Dashboard.css';

const AdminDashboard = () => {
  const { products } = useSelector(state => state.products);
  const { orders } = useSelector(state => state.orders);
  const { categories } = useSelector(state => state.categories);
  
  // For demo purposes, we'll create some sample statistics
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    totalProducts: 0,
    totalCategories: 0,
    lowStockProducts: 0
  });
  
  // Calculate statistics when orders, products, or categories change
  useEffect(() => {
    if (!orders.length && !products.length) return;
    
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter(order => 
      order.status === 'processing' || order.status === 'shipped'
    ).length;
    const averageOrderValue = totalOrders ? totalSales / totalOrders : 0;
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const lowStockProducts = products.filter(product => 
      product.stockQuantity && product.stockQuantity < 10
    ).length;
    
    setStats({
      totalSales,
      totalOrders,
      pendingOrders,
      averageOrderValue,
      totalProducts,
      totalCategories,
      lowStockProducts
    });
  }, [orders, products, categories]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Get recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
    
  // Get top selling products
  const topSellingProducts = [...products]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 5);
  
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon sales">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-details">
            <h3>Total Sales</h3>
            <div className="stat-value">{formatCurrency(stats.totalSales)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orders">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="stat-details">
            <h3>Total Orders</h3>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-details">
            <h3>Pending Orders</h3>
            <div className="stat-value">{stats.pendingOrders}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon average">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-details">
            <h3>Average Order</h3>
            <div className="stat-value">{formatCurrency(stats.averageOrderValue)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon products">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-details">
            <h3>Total Products</h3>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon categories">
            <i className="fas fa-tags"></i>
          </div>
          <div className="stat-details">
            <h3>Categories</h3>
            <div className="stat-value">{stats.totalCategories}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon low-stock">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-details">
            <h3>Low Stock Items</h3>
            <div className="stat-value">{stats.lowStockProducts}</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-charts-grid">
        <div className="chart-card">
          <h2>Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="recent-orders-table">
              <div className="table-header">
                <div className="table-cell">Order ID</div>
                <div className="table-cell">Date</div>
                <div className="table-cell">Customer</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Total</div>
              </div>
              
              {recentOrders.map(order => (
                <div className="table-row" key={order.id}>
                  <div className="table-cell">{order.id}</div>
                  <div className="table-cell">{new Date(order.createdAt).toLocaleDateString()}</div>
                  <div className="table-cell">{order.shippingAddress?.fullName || 'N/A'}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="table-cell">{formatCurrency(order.totalAmount || 0)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No recent orders</div>
          )}
        </div>
        
        <div className="chart-card">
          <h2>Top Selling Products</h2>
          {topSellingProducts.length > 0 ? (
            <div className="top-products">
              {topSellingProducts.map(product => (
                <div className="top-product-item" key={product.id}>
                  <div className="product-image">
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/60'} 
                      alt={product.name} 
                    />
                  </div>
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <div className="product-meta">
                      <span className="price">{formatCurrency(product.price || 0)}</span>
                      <span className="sold">{product.soldCount || 0} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No product sales data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
