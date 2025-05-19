import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserRole, deactivateUser, activateUser } from '../../store/slices/userSlice';
import './Users.css';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector(state => state.users);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);
  
  // Filter and sort users
  const getFilteredUsers = () => {
    // Apply search filter
    let results = [...users];
    
    if (searchTerm) {
      results = results.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      results = results.filter(user => user.isActive === isActive);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      results = results.filter(user => user.role === roleFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name-asc':
        results.sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName));
        break;
      case 'name-desc':
        results.sort((a, b) => (b.firstName + b.lastName).localeCompare(a.firstName + a.lastName));
        break;
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return results;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle role change
  const handleRoleChange = (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      dispatch(updateUserRole({ id: userId, role: newRole }));
    }
  };
  
  // Handle status change
  const handleStatusChange = (userId, isActive) => {
    const action = isActive ? 'activate' : 'deactivate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      if (isActive) {
        dispatch(activateUser(userId));
      } else {
        dispatch(deactivateUser(userId));
      }
    }
  };
  
  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>Users</h1>
      </div>
      
      <div className="filters-bar">
        <div className="search-box">
          <input 
            type="text"
            placeholder="Search users..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div className="filter-box">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div className="sort-box">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>
                    {user.firstName} {user.lastName}
                    <div className="username">{user.username}</div>
                  </td>
                  <td>{user.email}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-dropdown">
                      <button className="view-details-btn">
                        <i className="fas fa-user"></i> View
                      </button>
                      <div className="role-dropdown">
                        <button className="role-btn">
                          Role <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className="role-options">
                          <button 
                            onClick={() => handleRoleChange(user.id, 'user')}
                            className={user.role === 'user' ? 'active' : ''}
                          >
                            User
                          </button>
                          <button 
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            className={user.role === 'admin' ? 'active' : ''}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                      <button 
                        className={`status-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => handleStatusChange(user.id, !user.isActive)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {getFilteredUsers().length === 0 && (
                <tr>
                  <td colSpan="7" className="no-results">
                    No users found.
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

export default AdminUsers;
