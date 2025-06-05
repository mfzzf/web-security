import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Successfully subscribed to our newsletter! 🎉');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/categories', label: 'Categories' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' }
  ];

  const customerServiceLinks = [
    { path: '/help', label: 'Help Center' },
    { path: '/shipping', label: 'Shipping Info' },
    { path: '/returns', label: 'Returns' },
    { path: '/track-order', label: 'Track Order' },
    { path: '/size-guide', label: 'Size Guide' }
  ];

  const legalLinks = [
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/cookies', label: 'Cookie Policy' }
  ];

  const socialLinks = [
    { 
      platform: 'facebook', 
      url: 'https://facebook.com/eshop', 
      icon: '📘',
      label: 'Facebook'
    },
    { 
      platform: 'twitter', 
      url: 'https://twitter.com/eshop', 
      icon: '🐦',
      label: 'Twitter'
    },
    { 
      platform: 'instagram', 
      url: 'https://instagram.com/eshop', 
      icon: '📷',
      label: 'Instagram'
    },
    { 
      platform: 'linkedin', 
      url: 'https://linkedin.com/company/eshop', 
      icon: '💼',
      label: 'LinkedIn'
    }
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Company Info */}
          <div className="footer-section company-info">
            <div className="company-logo">E-Shop</div>
            <p>
              Your trusted online shopping destination. We offer high-quality products 
              at competitive prices with exceptional customer service. Shop with confidence 
              and experience the difference.
            </p>
            
            {/* Social Links */}
            <div className="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  className={`social-link ${social.platform}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${social.label}`}
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-section">
            <h3>Customer Service</h3>
            <ul className="footer-links">
              {customerServiceLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="footer-section">
            <h3>Stay Connected</h3>
            
            {/* Newsletter Signup */}
            <div className="newsletter-signup">
              <p>Subscribe to get updates on new products and exclusive offers!</p>
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing}
                  required
                />
                <button 
                  type="submit"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <ul className="contact-info">
              <li>
                <span className="icon">📍</span>
                123 Shopping Street, City, State 12345
              </li>
              <li>
                <span className="icon">📞</span>
                +1 (555) 123-4567
              </li>
              <li>
                <span className="icon">✉️</span>
                support@eshop.com
              </li>
              <li>
                <span className="icon">🕒</span>
                Mon-Fri: 9AM-6PM EST
              </li>
            </ul>

            {/* App Download */}
            <div className="app-download">
              <p>Download our mobile app:</p>
              <div className="download-buttons">
                <button 
                  type="button"
                  className="download-btn" 
                  aria-label="Download on App Store"
                  onClick={() => toast.info('App Store download coming soon!')}
                >
                  <span className="icon">🍎</span>
                  <div className="text">
                    <span className="small">Download on the</span>
                    <span className="large">App Store</span>
                  </div>
                </button>
                <button 
                  type="button"
                  className="download-btn" 
                  aria-label="Get it on Google Play"
                  onClick={() => toast.info('Google Play download coming soon!')}
                >
                  <span className="icon">🤖</span>
                  <div className="text">
                    <span className="small">Get it on</span>
                    <span className="large">Google Play</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p>&copy; {currentYear} E-Shop. All rights reserved.</p>
          </div>
          
          <div className="footer-bottom-right">
            {/* Legal Links */}
            <ul className="footer-links-inline">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>

            {/* Payment Methods */}
            <div className="payment-methods">
              <div className="payment-icon" title="Visa">VISA</div>
              <div className="payment-icon" title="Mastercard">MC</div>
              <div className="payment-icon" title="American Express">AMEX</div>
              <div className="payment-icon" title="PayPal">PP</div>
              <div className="payment-icon" title="Apple Pay">🍎</div>
              <div className="payment-icon" title="Google Pay">G</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button 
        className="scroll-to-top"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        ↑
      </button>
    </footer>
  );
};

export default Footer;
