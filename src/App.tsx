import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from './components/layout/CustomerLayout';
import { BrokerLayout } from './components/layout/BrokerLayout';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { BrokerAuthPage } from './pages/auth/BrokerAuthPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';

// MYSTRIO Initiative Sub-Pages
import { AboutMystrioPage } from './pages/mytrio/AboutMystrioPage';
import { CareersPage } from './pages/mytrio/CareersPage';
import { BlogPage } from './pages/mytrio/BlogPage';
import { ContactPage } from './pages/mytrio/ContactPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { MyBrokersPage } from './pages/customer/MyBrokersPage';
import { ProductsPage } from './pages/customer/ProductsPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { BrokerProfilePage } from './pages/customer/BrokerProfilePage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { MessagesPage } from './pages/customer/MessagesPage';
import { AppointmentsPage } from './pages/customer/AppointmentsPage';
import { CustomerSettingsPage } from './pages/customer/CustomerSettingsPage';

// Broker Pages
import { BrokerDashboard } from './pages/broker/BrokerDashboard';
import { ProductManagement } from './pages/broker/ProductManagement';
import { BrokerMessages } from './pages/broker/BrokerMessages';
import { NotificationCenter } from './pages/broker/NotificationCenter';
import { OrderTracking } from './pages/broker/OrderTracking';
import { BrokerSettings } from './pages/broker/BrokerSettings';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public & Initiative Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/broker/auth" element={<BrokerAuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* MYSTRIO Sub-Pages */}
        <Route path="/about-mystrio" element={<AboutMystrioPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Customer Portal */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="my-brokers" element={<MyBrokersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="brokers/:brokerId" element={<BrokerProfilePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="settings" element={<CustomerSettingsPage />} />
        </Route>

        {/* Broker Portal */}
        <Route path="/broker" element={<BrokerLayout />}>
          <Route index element={<Navigate to="/broker/dashboard" replace />} />
          <Route path="dashboard" element={<BrokerDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="messages" element={<BrokerMessages />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="orders" element={<OrderTracking />} />
          <Route path="settings" element={<BrokerSettings />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
