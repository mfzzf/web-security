import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './Reports.css';

// Mock data for charts and reports
const mockSalesData = {
  daily: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.floor(Math.random() * 5000) + 1000
  })),
  weekly: Array.from({ length: 12 }, (_, i) => ({
    week: `Week ${i + 1}`,
    value: Math.floor(Math.random() * 30000) + 10000
  })),
  monthly: Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    value: Math.floor(Math.random() * 100000) + 50000
  }))
};

const mockProductsData = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  sales: Math.floor(Math.random() * 500) + 100,
  revenue: Math.floor(Math.random() * 10000) + 1000
}));

const mockCategoriesData = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Category ${i + 1}`,
  sales: Math.floor(Math.random() * 1000) + 200,
  revenue: Math.floor(Math.random() * 20000) + 5000
}));

const AdminReports = () => {
  const [timeRange, setTimeRange] = useState('monthly');
  const [reportType, setReportType] = useState('sales');
  const [salesData, setSalesData] = useState(mockSalesData.monthly);
  const [topProducts, setTopProducts] = useState(mockProductsData);
  const [topCategories, setTopCategories] = useState(mockCategoriesData);

  // Change data when time range changes
  useEffect(() => {
    setSalesData(mockSalesData[timeRange]);
  }, [timeRange]);

  // Calculate totals
  const calculateTotalSales = () => {
    return salesData.reduce((acc, item) => acc + item.value, 0);
  };

  const calculateTotalProductSales = () => {
    return topProducts.reduce((acc, product) => acc + product.sales, 0);
  };

  const calculateTotalRevenue = () => {
    return topProducts.reduce((acc, product) => acc + product.revenue, 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  // Calculate maximum value for chart scaling
  const getMaxValue = () => {
    return Math.max(...salesData.map(item => item.value)) * 1.1;
  };

  return (
    <div className="admin-reports">
      <div className="page-header">
        <h1>Reports</h1>
        <div className="report-controls">
          <div className="report-type-selector">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="sales">Sales Report</option>
              <option value="products">Product Performance</option>
              <option value="customers">Customer Analytics</option>
            </select>
          </div>
          <div className="time-range-selector">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="daily">Last 30 Days</option>
              <option value="weekly">Last 12 Weeks</option>
              <option value="monthly">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {reportType === 'sales' && (
        <div className="report-container sales-report">
          <div className="report-summary">
            <div className="summary-card">
              <h3>Total Sales</h3>
              <p className="summary-value">{formatCurrency(calculateTotalSales())}</p>
              <p className="summary-period">
                {timeRange === 'daily' && 'Last 30 Days'}
                {timeRange === 'weekly' && 'Last 12 Weeks'}
                {timeRange === 'monthly' && 'Last 12 Months'}
              </p>
            </div>
            <div className="summary-card">
              <h3>Average Sale</h3>
              <p className="summary-value">
                {formatCurrency(calculateTotalSales() / salesData.length)}
              </p>
              <p className="summary-period">Per {timeRange.slice(0, -2)}</p>
            </div>
            <div className="summary-card">
              <h3>Highest Sales</h3>
              <p className="summary-value">
                {formatCurrency(Math.max(...salesData.map(item => item.value)))}
              </p>
              <p className="summary-period">
                {timeRange === 'daily' && 'Day'}
                {timeRange === 'weekly' && 'Week'}
                {timeRange === 'monthly' && 'Month'}
              </p>
            </div>
          </div>

          <div className="chart-container">
            <h2>Sales Trend</h2>
            <div className="chart">
              <div className="chart-bars">
                {salesData.map((item, index) => (
                  <div 
                    key={index} 
                    className="chart-bar"
                    style={{ 
                      height: `${(item.value / getMaxValue()) * 100}%`,
                    }}
                    title={`${timeRange === 'daily' ? item.date : timeRange === 'weekly' ? item.week : item.month}: ${formatCurrency(item.value)}`}
                  >
                    <div className="bar-value">{formatCurrency(item.value)}</div>
                  </div>
                ))}
              </div>
              <div className="chart-labels">
                {salesData.map((item, index) => (
                  <div key={index} className="chart-label">
                    {timeRange === 'daily' ? new Date(item.date).getDate() : 
                     timeRange === 'weekly' ? item.week.split(' ')[1] : 
                     item.month}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="data-tables">
            <div className="data-table">
              <h2>Top Selling Products</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 5).map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sales}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="data-table">
              <h2>Top Categories</h2>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map(category => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.sales}</td>
                      <td>{formatCurrency(category.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'products' && (
        <div className="report-container products-report">
          <div className="report-summary">
            <div className="summary-card">
              <h3>Total Products Sold</h3>
              <p className="summary-value">{calculateTotalProductSales()}</p>
              <p className="summary-period">
                {timeRange === 'daily' && 'Last 30 Days'}
                {timeRange === 'weekly' && 'Last 12 Weeks'}
                {timeRange === 'monthly' && 'Last 12 Months'}
              </p>
            </div>
            <div className="summary-card">
              <h3>Total Revenue</h3>
              <p className="summary-value">{formatCurrency(calculateTotalRevenue())}</p>
              <p className="summary-period">
                {timeRange === 'daily' && 'Last 30 Days'}
                {timeRange === 'weekly' && 'Last 12 Weeks'}
                {timeRange === 'monthly' && 'Last 12 Months'}
              </p>
            </div>
            <div className="summary-card">
              <h3>Average Price</h3>
              <p className="summary-value">
                {formatCurrency(calculateTotalRevenue() / calculateTotalProductSales())}
              </p>
              <p className="summary-period">Per Unit</p>
            </div>
          </div>

          <div className="data-tables full-width">
            <div className="data-table">
              <h2>Product Performance</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Avg. Price</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sales}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                      <td>{formatCurrency(product.revenue / product.sales)}</td>
                      <td>{((product.revenue / calculateTotalRevenue()) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="report-container customers-report">
          <div className="notice">
            <p>Customer analytics reports are being developed. Check back soon!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
