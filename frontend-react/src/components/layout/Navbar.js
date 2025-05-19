import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { totalQuantity } = useSelector(state => state.cart);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <h1>E-Shop</h1>
          </Link>
        </div>
        
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">
              <i className="fa fa-search"></i>
              Search
            </button>
          </form>
        </div>
        
        <div className="menu-icon" onClick={toggleMenu}>
          <i className={isOpen ? 'fa fa-times' : 'fa fa-bars'}></i>
        </div>
        
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/" className="nav-links" onClick={toggleMenu}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/products" className="nav-links" onClick={toggleMenu}>
              Products
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/categories" className="nav-links" onClick={toggleMenu}>
              Categories
            </Link>
          </li>
          
          {isAuthenticated ? (
            <li className="nav-item dropdown">
              <span className="nav-links dropdown-toggle">
                {user?.username || 'Account'} <i className="fa fa-caret-down"></i>
              </span>
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-link" onClick={toggleMenu}>
                  Profile
                </Link>
                <Link to="/orders" className="dropdown-link" onClick={toggleMenu}>
                  Orders
                </Link>
                {user?.isAdmin && (
                  <Link to="/admin" className="dropdown-link" onClick={toggleMenu}>
                    Admin Dashboard
                  </Link>
                )}
                <button className="dropdown-link logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </li>
          ) : (
            <li className="nav-item">
              <Link to="/login" className="nav-links" onClick={toggleMenu}>
                Login
              </Link>
            </li>
          )}
          
          <li className="nav-item cart-icon">
            <Link to="/cart" className="nav-links" onClick={toggleMenu}>
              <svg className="cart-svg-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M246.4 912a2.1 2.1 0 1 0 134.4 0 2.1 2.1 0 1 0-134.4 0Z"></path>
                <path d="M716.8 912a2.1 2.1 0 1 0 134.4 0 2.1 2.1 0 1 0-134.4 0Z"></path>
                <path d="M905.6 764.8l-537.6 0c-28.8 0-57.6-25.6-64-54.4l-96-566.4c-9.6-54.4-60.8-96-115.2-96l-22.4 0c-12.8 0-25.6 12.8-25.6 25.6 0 12.8 12.8 25.6 25.6 25.6l22.4 0c28.8 0 57.6 25.6 64 54.4l96 566.4c9.6 54.4 60.8 96 115.2 96l537.6 0c12.8 0 25.6-12.8 25.6-25.6C931.2 777.6 921.6 764.8 905.6 764.8z"></path>
                <path d="M880 179.2l-572.8 0c-12.8 0-25.6 12.8-25.6 25.6 0 12.8 12.8 25.6 25.6 25.6l572.8 0c25.6 0 38.4 16 32 41.6l-70.4 281.6c-6.4 32-41.6 57.6-73.6 60.8l-396.8 28.8c-12.8 0-25.6 12.8-22.4 28.8 0 12.8 12.8 25.6 28.8 22.4l396.8-28.8c54.4-3.2 105.6-48 118.4-99.2l70.4-281.6C976 230.4 937.6 179.2 880 179.2z"></path>
              </svg>
              <span className="cart-count">{totalQuantity || 0}</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
