import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { HomePage } from './pages/HomePage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AdminCatalogPage } from './pages/AdminCatalogPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminDiscountsPage } from './pages/AdminDiscountsPage';
import { AdminReturnsPage } from './pages/AdminReturnsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { AddressManagementPage } from './pages/AddressManagementPage';
import { AdminLayout } from './components/AdminLayout';
import { CustomerLayout } from './components/CustomerLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AIChatWidget } from './components/AIChatWidget';
import { ToastProvider } from './context/ToastContext';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Customer Routes Wrapped in CustomerLayout */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/addresses" element={<AddressManagementPage />} />
          </Route>

          {/* Standalone Customer Routes */}
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/customer/login" element={<CustomerLoginPage />} />

          {/* Admin Auth & Routes */}
          <Route path="/crm" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<Navigate to="/crm" replace />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="catalog" element={<AdminCatalogPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="discounts" element={<AdminDiscountsPage />} />
            <Route path="returns" element={<AdminReturnsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
        <AIChatWidget />
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
