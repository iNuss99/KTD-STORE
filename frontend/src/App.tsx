import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AdminLayout } from './components/AdminLayout';
import { CustomerLayout } from './components/CustomerLayout';
import { ToastProvider } from './context/ToastContext';

// Customer Pages (Code-split with React.lazy)
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductListPage = lazy(() => import('./pages/ProductListPage').then((m) => ({ default: m.ProductListPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const AddressManagementPage = lazy(() => import('./pages/AddressManagementPage').then((m) => ({ default: m.AddressManagementPage })));
const CustomerLoginPage = lazy(() => import('./pages/CustomerLoginPage').then((m) => ({ default: m.CustomerLoginPage })));

// Admin Pages (Code-split with React.lazy)
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminStaffPage = lazy(() => import('./pages/AdminStaffPage').then((m) => ({ default: m.AdminStaffPage })));
const AdminCatalogPage = lazy(() => import('./pages/AdminCatalogPage').then((m) => ({ default: m.AdminCatalogPage })));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminDiscountsPage = lazy(() => import('./pages/AdminDiscountsPage').then((m) => ({ default: m.AdminDiscountsPage })));
const AdminReturnsPage = lazy(() => import('./pages/AdminReturnsPage').then((m) => ({ default: m.AdminReturnsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="mt-3 text-xs font-semibold text-slate-500 tracking-wider uppercase">Đang tải dữ liệu...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
