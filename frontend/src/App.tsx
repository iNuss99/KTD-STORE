import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AdminLayout } from './components/layouts/AdminLayout';
import { CustomerLayout } from './components/layouts/CustomerLayout';
import { ToastProvider } from './context/ToastContext';
import { ScrollToTop } from './components/common/ScrollToTop';

// Customer Pages (Code-split with React.lazy)
const HomePage = lazy(() => import('./pages/storefront/HomePage').then((m) => ({ default: m.HomePage })));
const ProductListPage = lazy(() => import('./pages/storefront/ProductListPage').then((m) => ({ default: m.ProductListPage })));
const ProductDetailPage = lazy(() => import('./pages/storefront/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/storefront/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/storefront/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/storefront/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const MyOrdersPage = lazy(() => import('./pages/storefront/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/storefront/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const WishlistPage = lazy(() => import('./pages/storefront/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const AddressManagementPage = lazy(() => import('./pages/storefront/AddressManagementPage').then((m) => ({ default: m.AddressManagementPage })));
const CustomerLoginPage = lazy(() => import('./pages/storefront/CustomerLoginPage').then((m) => ({ default: m.CustomerLoginPage })));

// Admin Pages (Code-split with React.lazy)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage').then((m) => ({ default: m.AdminStaffPage })));
const AdminCatalogPage = lazy(() => import('./pages/admin/AdminCatalogPage').then((m) => ({ default: m.AdminCatalogPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminDiscountsPage = lazy(() => import('./pages/admin/AdminDiscountsPage').then((m) => ({ default: m.AdminDiscountsPage })));
const AdminReturnsPage = lazy(() => import('./pages/admin/AdminReturnsPage').then((m) => ({ default: m.AdminReturnsPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

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
          <ScrollToTop />
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
              <Route path="/customer/login" element={<Navigate to="/login" replace />} />

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
