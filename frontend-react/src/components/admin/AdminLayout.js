import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/admin' } });
      return;
    }

    if (!user?.isAdmin) {
      navigate('/'); // Redirect non-admin users to home
    }
  }, [isAuthenticated, user, navigate]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="admin-layout">
      {/* Desktop Sidebar */}
      <AdminSidebar />
      
      {/* Mobile Sidebar */}
      <AdminSidebar isMobile toggleSidebar={toggleSidebar} />
      
      <div className="admin-main">
        <div className="admin-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="admin-user">
            <span className="welcome-message">Welcome, {user?.username}</span>
          </div>
        </div>
        
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
