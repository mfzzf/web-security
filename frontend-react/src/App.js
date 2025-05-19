import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { fetchUserProfile } from './store/slices/authSlice';
import CartPopup from './components/CartPopup';

// Main layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/admin/AdminLayout';

// Page components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Admin components
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

import './App.css';

// 会话恢复组件 - 在应用启动时自动恢复用户会话
function SessionManager() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // 在组件挂载时检查并恢复用户会话
    if (localStorage.getItem('accessToken')) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);
  
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <SessionManager />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
        <CartPopup />
        <Routes>
          {/* Admin Routes with AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Public Routes with standard layout */}
          <Route path="/" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Home />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/login" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Login />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/register" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Register />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/categories" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Categories />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/products" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Products />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/products/:id" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <ProductDetails />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/cart" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Cart />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/checkout" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Checkout />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/profile" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <Profile />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/orders" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <OrderHistory />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/orders/:id" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <OrderDetails />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/payment/success" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <PaymentSuccess />
              </main>
              <Footer />
            </div>
          } />
          <Route path="/payment/cancel" element={
            <div className="App">
              <Navbar />
              <main className="container">
                <PaymentCancel />
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
