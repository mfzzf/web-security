import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import './Settings.css';

const AdminSettings = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'E-Commerce Store',
    storeEmail: 'contact@ecommerce.com',
    storePhone: '+1 (555) 123-4567',
    storeAddress: '123 E-Commerce St, Shopping City, 12345',
    storeCurrency: 'USD',
    storeLanguage: 'en',
    enableMultiCurrency: false,
    enableMultiLanguage: false
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.example.com',
    smtpPort: '587',
    smtpUsername: 'notifications@ecommerce.com',
    smtpPassword: '************',
    fromEmail: 'no-reply@ecommerce.com',
    fromName: 'E-Commerce Store',
    enableEmailNotifications: true,
    notifyOnNewOrder: true,
    notifyOnOrderStatusChange: true,
    notifyOnLowStock: true
  });

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    enablePaypal: true,
    enableStripe: true,
    enableCreditCard: true,
    enableBankTransfer: false,
    testMode: true,
    paypalClientId: 'test_client_id',
    stripePublicKey: 'pk_test_key',
    stripeSecretKey: '**********'
  });

  // Shipping settings
  const [shippingSettings, setShippingSettings] = useState({
    enableFreeShipping: true,
    freeShippingMinimum: 50,
    enableFlatRate: true,
    flatRateAmount: 5.99,
    enableLocalPickup: false,
    enableInternationalShipping: false,
    defaultShippingCountry: 'United States'
  });

  // Handle input changes for general settings
  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle input changes for email settings
  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings({
      ...emailSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle input changes for payment settings
  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings({
      ...paymentSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle input changes for shipping settings
  const handleShippingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShippingSettings({
      ...shippingSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real application, this would dispatch actions to update settings
    alert('Settings saved successfully!');
  };

  // Reset form to initial values
  const handleReset = (settingsType) => {
    switch (settingsType) {
      case 'general':
        setGeneralSettings({
          storeName: 'E-Commerce Store',
          storeEmail: 'contact@ecommerce.com',
          storePhone: '+1 (555) 123-4567',
          storeAddress: '123 E-Commerce St, Shopping City, 12345',
          storeCurrency: 'USD',
          storeLanguage: 'en',
          enableMultiCurrency: false,
          enableMultiLanguage: false
        });
        break;
      case 'email':
        setEmailSettings({
          smtpServer: 'smtp.example.com',
          smtpPort: '587',
          smtpUsername: 'notifications@ecommerce.com',
          smtpPassword: '************',
          fromEmail: 'no-reply@ecommerce.com',
          fromName: 'E-Commerce Store',
          enableEmailNotifications: true,
          notifyOnNewOrder: true,
          notifyOnOrderStatusChange: true,
          notifyOnLowStock: true
        });
        break;
      case 'payment':
        setPaymentSettings({
          enablePaypal: true,
          enableStripe: true,
          enableCreditCard: true,
          enableBankTransfer: false,
          testMode: true,
          paypalClientId: 'test_client_id',
          stripePublicKey: 'pk_test_key',
          stripeSecretKey: '**********'
        });
        break;
      case 'shipping':
        setShippingSettings({
          enableFreeShipping: true,
          freeShippingMinimum: 50,
          enableFlatRate: true,
          flatRateAmount: 5.99,
          enableLocalPickup: false,
          enableInternationalShipping: false,
          defaultShippingCountry: 'United States'
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="admin-settings">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fas fa-store"></i>
            General
          </button>
          <button 
            className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <i className="fas fa-envelope"></i>
            Email
          </button>
          <button 
            className={`tab-button ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <i className="fas fa-credit-card"></i>
            Payment
          </button>
          <button 
            className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <i className="fas fa-shipping-fast"></i>
            Shipping
          </button>
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-shield-alt"></i>
            Security
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-panel">
              <h2>General Settings</h2>
              <p className="settings-description">
                Configure your store's basic information and localization settings.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={generalSettings.storeName}
                    onChange={handleGeneralChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storeEmail">Store Email</label>
                  <input
                    type="email"
                    id="storeEmail"
                    name="storeEmail"
                    value={generalSettings.storeEmail}
                    onChange={handleGeneralChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storePhone">Store Phone</label>
                  <input
                    type="text"
                    id="storePhone"
                    name="storePhone"
                    value={generalSettings.storePhone}
                    onChange={handleGeneralChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storeAddress">Store Address</label>
                  <textarea
                    id="storeAddress"
                    name="storeAddress"
                    value={generalSettings.storeAddress}
                    onChange={handleGeneralChange}
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="storeCurrency">Default Currency</label>
                    <select
                      id="storeCurrency"
                      name="storeCurrency"
                      value={generalSettings.storeCurrency}
                      onChange={handleGeneralChange}
                    >
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="JPY">Japanese Yen (JPY)</option>
                      <option value="CAD">Canadian Dollar (CAD)</option>
                      <option value="AUD">Australian Dollar (AUD)</option>
                      <option value="CNY">Chinese Yuan (CNY)</option>
                    </select>
                  </div>

                  <div className="form-group half">
                    <label htmlFor="storeLanguage">Default Language</label>
                    <select
                      id="storeLanguage"
                      name="storeLanguage"
                      value={generalSettings.storeLanguage}
                      onChange={handleGeneralChange}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="enableMultiCurrency"
                    name="enableMultiCurrency"
                    checked={generalSettings.enableMultiCurrency}
                    onChange={handleGeneralChange}
                  />
                  <label htmlFor="enableMultiCurrency">Enable multiple currencies</label>
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="enableMultiLanguage"
                    name="enableMultiLanguage"
                    checked={generalSettings.enableMultiLanguage}
                    onChange={handleGeneralChange}
                  />
                  <label htmlFor="enableMultiLanguage">Enable multiple languages</label>
                </div>

                <div className="form-actions">
                  <button type="button" className="reset-btn" onClick={() => handleReset('general')}>
                    Reset
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="settings-panel">
              <h2>Email Settings</h2>
              <p className="settings-description">
                Configure your store's email settings and notification preferences.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>SMTP Configuration</h3>
                  <div className="form-group">
                    <label htmlFor="smtpServer">SMTP Server</label>
                    <input
                      type="text"
                      id="smtpServer"
                      name="smtpServer"
                      value={emailSettings.smtpServer}
                      onChange={handleEmailChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="smtpPort">SMTP Port</label>
                    <input
                      type="text"
                      id="smtpPort"
                      name="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={handleEmailChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="smtpUsername">SMTP Username</label>
                    <input
                      type="text"
                      id="smtpUsername"
                      name="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={handleEmailChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="smtpPassword">SMTP Password</label>
                    <input
                      type="password"
                      id="smtpPassword"
                      name="smtpPassword"
                      value={emailSettings.smtpPassword}
                      onChange={handleEmailChange}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Email Identity</h3>
                  <div className="form-group">
                    <label htmlFor="fromEmail">From Email</label>
                    <input
                      type="email"
                      id="fromEmail"
                      name="fromEmail"
                      value={emailSettings.fromEmail}
                      onChange={handleEmailChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fromName">From Name</label>
                    <input
                      type="text"
                      id="fromName"
                      name="fromName"
                      value={emailSettings.fromName}
                      onChange={handleEmailChange}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Notification Settings</h3>
                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="enableEmailNotifications"
                      name="enableEmailNotifications"
                      checked={emailSettings.enableEmailNotifications}
                      onChange={handleEmailChange}
                    />
                    <label htmlFor="enableEmailNotifications">Enable email notifications</label>
                  </div>

                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="notifyOnNewOrder"
                      name="notifyOnNewOrder"
                      checked={emailSettings.notifyOnNewOrder}
                      onChange={handleEmailChange}
                    />
                    <label htmlFor="notifyOnNewOrder">Notify on new order</label>
                  </div>

                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="notifyOnOrderStatusChange"
                      name="notifyOnOrderStatusChange"
                      checked={emailSettings.notifyOnOrderStatusChange}
                      onChange={handleEmailChange}
                    />
                    <label htmlFor="notifyOnOrderStatusChange">Notify on order status change</label>
                  </div>

                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="notifyOnLowStock"
                      name="notifyOnLowStock"
                      checked={emailSettings.notifyOnLowStock}
                      onChange={handleEmailChange}
                    />
                    <label htmlFor="notifyOnLowStock">Notify on low stock</label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="reset-btn" onClick={() => handleReset('email')}>
                    Reset
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="settings-panel">
              <h2>Payment Settings</h2>
              <p className="settings-description">
                Configure your store's payment methods and settings.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Payment Methods</h3>
                  
                  <div className="payment-method">
                    <div className="payment-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enablePaypal"
                          name="enablePaypal"
                          checked={paymentSettings.enablePaypal}
                          onChange={handlePaymentChange}
                        />
                        <label htmlFor="enablePaypal">
                          <i className="fab fa-paypal"></i> PayPal
                        </label>
                      </div>
                    </div>
                    
                    {paymentSettings.enablePaypal && (
                      <div className="payment-method-content">
                        <div className="form-group">
                          <label htmlFor="paypalClientId">PayPal Client ID</label>
                          <input
                            type="text"
                            id="paypalClientId"
                            name="paypalClientId"
                            value={paymentSettings.paypalClientId}
                            onChange={handlePaymentChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="payment-method">
                    <div className="payment-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enableStripe"
                          name="enableStripe"
                          checked={paymentSettings.enableStripe}
                          onChange={handlePaymentChange}
                        />
                        <label htmlFor="enableStripe">
                          <i className="fab fa-stripe"></i> Stripe
                        </label>
                      </div>
                    </div>
                    
                    {paymentSettings.enableStripe && (
                      <div className="payment-method-content">
                        <div className="form-group">
                          <label htmlFor="stripePublicKey">Stripe Public Key</label>
                          <input
                            type="text"
                            id="stripePublicKey"
                            name="stripePublicKey"
                            value={paymentSettings.stripePublicKey}
                            onChange={handlePaymentChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="stripeSecretKey">Stripe Secret Key</label>
                          <input
                            type="password"
                            id="stripeSecretKey"
                            name="stripeSecretKey"
                            value={paymentSettings.stripeSecretKey}
                            onChange={handlePaymentChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="payment-method">
                    <div className="payment-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enableCreditCard"
                          name="enableCreditCard"
                          checked={paymentSettings.enableCreditCard}
                          onChange={handlePaymentChange}
                        />
                        <label htmlFor="enableCreditCard">
                          <i className="fas fa-credit-card"></i> Credit Card
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="payment-method">
                    <div className="payment-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enableBankTransfer"
                          name="enableBankTransfer"
                          checked={paymentSettings.enableBankTransfer}
                          onChange={handlePaymentChange}
                        />
                        <label htmlFor="enableBankTransfer">
                          <i className="fas fa-university"></i> Bank Transfer
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Test Mode</h3>
                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="testMode"
                      name="testMode"
                      checked={paymentSettings.testMode}
                      onChange={handlePaymentChange}
                    />
                    <label htmlFor="testMode">Enable test mode (no real charges will be made)</label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="reset-btn" onClick={() => handleReset('payment')}>
                    Reset
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="settings-panel">
              <h2>Shipping Settings</h2>
              <p className="settings-description">
                Configure your store's shipping methods and rates.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>Shipping Methods</h3>
                  
                  <div className="shipping-method">
                    <div className="shipping-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enableFreeShipping"
                          name="enableFreeShipping"
                          checked={shippingSettings.enableFreeShipping}
                          onChange={handleShippingChange}
                        />
                        <label htmlFor="enableFreeShipping">Free Shipping</label>
                      </div>
                    </div>
                    
                    {shippingSettings.enableFreeShipping && (
                      <div className="shipping-method-content">
                        <div className="form-group">
                          <label htmlFor="freeShippingMinimum">
                            Minimum order amount for free shipping ($)
                          </label>
                          <input
                            type="number"
                            id="freeShippingMinimum"
                            name="freeShippingMinimum"
                            value={shippingSettings.freeShippingMinimum}
                            onChange={handleShippingChange}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shipping-method">
                    <div className="shipping-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enableFlatRate"
                          name="enableFlatRate"
                          checked={shippingSettings.enableFlatRate}
                          onChange={handleShippingChange}
                        />
                        <label htmlFor="enableFlatRate">Flat Rate Shipping</label>
                      </div>
                    </div>
                    
                    {shippingSettings.enableFlatRate && (
                      <div className="shipping-method-content">
                        <div className="form-group">
                          <label htmlFor="flatRateAmount">Flat rate amount ($)</label>
                          <input
                            type="number"
                            id="flatRateAmount"
                            name="flatRateAmount"
                            value={shippingSettings.flatRateAmount}
                            onChange={handleShippingChange}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shipping-method">
                    <div className="shipping-method-header">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="enableLocalPickup"
                          name="enableLocalPickup"
                          checked={shippingSettings.enableLocalPickup}
                          onChange={handleShippingChange}
                        />
                        <label htmlFor="enableLocalPickup">Local Pickup</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Shipping Zones</h3>
                  <div className="form-group">
                    <label htmlFor="defaultShippingCountry">Default Shipping Country</label>
                    <select
                      id="defaultShippingCountry"
                      name="defaultShippingCountry"
                      value={shippingSettings.defaultShippingCountry}
                      onChange={handleShippingChange}
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="China">China</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>

                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="enableInternationalShipping"
                      name="enableInternationalShipping"
                      checked={shippingSettings.enableInternationalShipping}
                      onChange={handleShippingChange}
                    />
                    <label htmlFor="enableInternationalShipping">Enable international shipping</label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="reset-btn" onClick={() => handleReset('shipping')}>
                    Reset
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-panel">
              <h2>Security Settings</h2>
              <p className="settings-description">
                Configure security settings for your store.
              </p>

              <div className="notice">
                <p>Security settings are being developed. Check back soon!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
