import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Package, Heart, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { NotificationBell } from '../widgets/NotificationBell';
import { SearchAutocomplete } from '../widgets/SearchAutocomplete';
import { useCart } from '../../hooks/useCart';
import { useMaintenanceMode } from '../../hooks/useSystemConfig';
import {
  getAuthToken,
  clearAuthToken,
  getUserName,
} from '../../lib/auth-storage';

export const SiteHeader: React.FC = () => {
  const { data: cart } = useCart();
  const { isMaintenance } = useMaintenanceMode();
  const cartCount = cart?.items?.length || 0;
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkAuth = useCallback(() => {
    const token = getAuthToken();
    if (token) {
      setUserName(getUserName() || 'Tài khoản');
    } else {
      setUserName(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('customer-auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('customer-auth-change', checkAuth);
    };
  }, [checkAuth]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    // Contextual Logout: Chỉ đăng xuất khỏi Storefront
    clearAuthToken();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#F5F2EE]/90 backdrop-blur-md border-b border-[#1A1A1A]/10 transition-all duration-300">
      {/* Maintenance Mode Alert Banner */}
      {isMaintenance && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 px-4 py-2.5 shadow-sm border-b border-amber-600 select-none">
          <span className="text-sm">⚠️</span>
          <span>
            <strong>THÔNG BÁO BẢO TRÌ:</strong> Hệ thống đang tạm ngưng nhận đơn hàng mới để bảo trì nâng cấp. Quý khách vẫn có thể tham quan sản phẩm!
          </span>
        </div>
      )}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-20 gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center group shrink-0" title="KTDL">
            <span className="font-brand text-2xl sm:text-3xl text-[#1A1A1A] tracking-wider leading-none group-hover:text-[#C8A96E] transition-colors py-1">
              KTDL
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex flex-1 justify-center items-center space-x-6">
            <Link
              to="/"
              className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                isActive('/') ? 'text-[#C8A96E] font-bold border-b border-[#C8A96E] pb-0.5' : 'text-[#1A1A1A] hover:text-[#C8A96E]'
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                isActive('/products') ? 'text-[#C8A96E] font-bold border-b border-[#C8A96E] pb-0.5' : 'text-[#1A1A1A] hover:text-[#C8A96E]'
              }`}
            >
              Bộ sưu tập
            </Link>
            <Link
              to="/about"
              className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                isActive('/about') ? 'text-[#C8A96E] font-bold border-b border-[#C8A96E] pb-0.5' : 'text-[#1A1A1A] hover:text-[#C8A96E]'
              }`}
            >
              Về chúng tôi
            </Link>
            <Link
              to="/my-orders"
              className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                isActive('/my-orders') ? 'text-[#C8A96E] font-bold border-b border-[#C8A96E] pb-0.5' : 'text-[#1A1A1A] hover:text-[#C8A96E]'
              }`}
            >
              Đơn hàng
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <SearchAutocomplete expandable />

            <NotificationBell isAdmin={false} />

            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="p-2 text-[#1A1A1A] hover:text-[#C8A96E] transition-colors block"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            <Link
              to="/cart"
              aria-label="Shopping Cart"
              className="p-2 text-[#1A1A1A] hover:text-[#C8A96E] transition-colors relative block"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#C8A96E] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account Status / Login Button */}
            {userName ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-bg-alt hover:bg-line/20 text-ink border border-line rounded-lg transition font-sans text-xs font-semibold"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#d97706] text-white flex items-center justify-center font-bold text-[10px] sm:text-[11px] uppercase shrink-0">
                    {userName.charAt(0)}
                  </div>
                  <span className="max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline">{userName}</span>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ink-soft" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl border border-line py-2 z-50 shadow-md font-sans text-xs font-medium space-y-1">

                    <Link
                      to="/my-orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-bg-alt hover:text-[#d97706]"
                    >
                      <Package className="w-4 h-4 text-[#d97706]" /> Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/addresses"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-bg-alt hover:text-[#d97706]"
                    >
                      <User className="w-4 h-4 text-[#d97706]" /> Sổ địa chỉ giao hàng
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-bg-alt hover:text-[#d97706]"
                    >
                      <Heart className="w-4 h-4 text-[#d97706]" /> Sản phẩm yêu thích
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-coral hover:bg-coral/10 text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4 text-coral" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white font-sans text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-colors shadow-xs shrink-0"
                >
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Đăng nhập</span>
                </Link>
              </div>
            )}

            {/* Mobile & Tablet menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-ink hover:bg-bg-alt rounded-xl transition cursor-pointer"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Off-canvas Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <aside
            aria-label="Mobile Navigation"
            className="fixed inset-y-0 right-0 max-w-sm w-full bg-[#F5F2EE] shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-line transform transition-transform duration-300 ease-out"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="font-brand text-2xl text-ink tracking-wider"
              >
                KTDL
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-ink-soft hover:text-ink hover:bg-bg-alt rounded-full transition cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 sm:p-6 space-y-6 flex-1">
              {/* Mobile Search Autocomplete */}
              <div className="w-full">
                <SearchAutocomplete onSearchSubmitted={() => setMobileMenuOpen(false)} />
              </div>



              {/* Main Navigation Links */}
              <nav className="space-y-1">
                <span className="font-mono text-[10px] text-ink-soft uppercase tracking-[0.2em] px-3 pb-2 block">
                  Danh mục chính
                </span>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition ${
                    isActive('/')
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-ink hover:bg-white hover:text-accent'
                  }`}
                >
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition ${
                    isActive('/products')
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-ink hover:bg-white hover:text-accent'
                  }`}
                >
                  <span>Tất cả sản phẩm (Bộ sưu tập)</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition ${
                    isActive('/about')
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-ink hover:bg-white hover:text-accent'
                  }`}
                >
                  <span>Về chúng tôi</span>
                </Link>
                <Link
                  to="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition ${
                    isActive('/my-orders')
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-ink hover:bg-white hover:text-accent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-accent" /> Đơn hàng của tôi
                  </span>
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition ${
                    isActive('/wishlist')
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-ink hover:bg-white hover:text-accent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-coral" /> Sản phẩm yêu thích
                  </span>
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition ${
                    isActive('/cart')
                      ? 'bg-accent/15 text-accent font-bold'
                      : 'text-ink hover:bg-white hover:text-accent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-accent" /> Giỏ hàng
                  </span>
                  {cartCount > 0 && (
                    <span className="bg-accent text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>

            {/* Drawer Footer (User Info & Actions) */}
            <div className="p-4 sm:p-6 border-t border-line bg-white/70 space-y-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {userName ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                      {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-soft">Đã đăng nhập</p>
                      <p className="text-sm font-bold text-ink truncate">{userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to="/addresses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center py-2 px-3 bg-bg-alt hover:bg-line/30 rounded-xl text-xs font-semibold text-ink transition"
                    >
                      Sổ địa chỉ
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 text-center py-2 px-3 bg-coral/10 hover:bg-coral/20 text-coral rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink hover:bg-accent text-white rounded-xl text-sm font-bold uppercase tracking-wider transition shadow-sm"
                >
                  <User className="w-4 h-4" /> Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
