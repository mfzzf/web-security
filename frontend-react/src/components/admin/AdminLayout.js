import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  // 添加调试日志，帮助确认用户角色和权限状态
  useEffect(() => {
    console.log('AdminLayout权限调试:', { 
      isAuthenticated, 
      user,
      role: user?.role,
      isAdmin: user?.isAdmin,
      userObject: user
    });
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (!isAuthenticated) {
      console.log('用户未认证，重定向到登录页');
      navigate('/login', { state: { from: '/admin' } });
      return;
    }

    if (!user?.isAdmin) {
      console.log('用户非管理员，重定向到首页', user);
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
