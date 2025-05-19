import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateProfile } from '../store/slices/authSlice';
import './Profile.css';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useSelector(state => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }

    dispatch(fetchUserProfile());
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }

      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare user data
    const userData = {
      ...formData,
      // Only include password fields if user is changing password
      ...(formData.newPassword ? {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      } : {})
    };

    // Clean up unnecessary fields
    delete userData.confirmPassword;
    if (!userData.newPassword) {
      delete userData.currentPassword;
    }

    // Dispatch update profile action
    dispatch(updateProfile(userData))
      .unwrap()
      .then(() => {
        // Success - refreshing user data not needed as the reducer already updates state
        setIsEditing(false);
      })
      .catch(error => {
        // Handle errors (could create a state for profile update errors)
        console.error('Profile update failed:', error);
        alert(`更新资料失败: ${error}`);
      });
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <h1>My Profile</h1>

      {!isEditing ? (
        <div className="profile-view">
          <div className="profile-card">
            <div className="profile-header">
              <h2>{user?.fullName || user?.username}</h2>
              <button
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>

            <div className="profile-info">
              <div className="info-section">
                <h3>Account Information</h3>
                <div className="info-row">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{user?.username}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Full Name:</span>
                  <span className="info-value">{user?.fullName || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{user?.phone || 'Not set'}</span>
                </div>
              </div>

              <div className="info-section">
                <h3>Address Information</h3>
                {user?.address ? (
                  <>
                    <div className="info-row">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{user.address}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">City:</span>
                      <span className="info-value">{user.city}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">State:</span>
                      <span className="info-value">{user.state}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ZIP Code:</span>
                      <span className="info-value">{user.zipCode}</span>
                    </div>
                  </>
                ) : (
                  <p className="no-info">No address information</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-links">
            <button
              className="view-orders-btn"
              onClick={() => navigate('/orders')}
            >
              View My Orders
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-edit">
          <div className="profile-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Account Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled // Username cannot be changed
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State/Province</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Change Password</h3>
                <p className="password-note">Leave blank if you don't want to change your password</p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={errors.currentPassword ? 'error' : ''}
                    />
                    {errors.currentPassword && <div className="error-message">{errors.currentPassword}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={errors.newPassword ? 'error' : ''}
                    />
                    {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
