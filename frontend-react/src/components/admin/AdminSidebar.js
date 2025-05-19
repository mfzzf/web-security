import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './AdminSidebar.css';

const AdminSidebar = ({ isMobile, toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className={`admin-sidebar ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
        {isMobile && (
          <button className="close-sidebar" onClick={toggleSidebar}>
            &times;
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/admin" 
          end
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/admin/products" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-box"></i>
          <span>Products</span>
        </NavLink>

        <NavLink 
          to="/admin/categories" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-tags"></i>
          <span>Categories</span>
        </NavLink>

        <NavLink 
          to="/admin/orders" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-shopping-cart"></i>
          <span>Orders</span>
        </NavLink>

        <NavLink 
          to="/admin/users" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-users"></i>
          <span>Users</span>
        </NavLink>

        <NavLink 
          to="/admin/reports" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-chart-bar"></i>
          <span>Reports</span>
        </NavLink>

        <NavLink 
          to="/admin/settings" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
        
        <NavLink 
          to="/" 
          className="return-to-site"
          onClick={isMobile ? toggleSidebar : undefined}
        >
          <i className="fas fa-store"></i>
          <span>Return to Site</span>
        </NavLink>
      </div>
    </div>
  );
};

export default AdminSidebar;
