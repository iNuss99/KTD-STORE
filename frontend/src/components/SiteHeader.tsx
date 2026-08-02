import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Package, Heart, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../hooks/useCart';
import { getAuthToken, clearAuthToken } from '../lib/auth-storage';

export const SiteHeader: React.FC = () => {
  const { data: cart } = useCart();
  const cartCount = cart?.items?.length || 0;
  const { lang, currency, setLang, setCurrency, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkAuth = () => {
    const token = getAuthToken();
    if (token) {
      const storedName = localStorage.getItem('user_name');
      const userStr = localStorage.getItem('user');
      if (storedName) {
        setUserName(storedName);
      } else if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUserName(u.full_name || u.email?.split('@')[0]);
        } catch {
          setUserName('Tài khoản');
        }
      } else {
        setUserName('Tài khoản');
      }
    } else {
      setUserName(null);
    }
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    window.dispatchEvent(new Event('auth-change'));
    setShowUserMenu(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-line font-sans transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" title="Knot To Detail">
            <img
              src="/logo.png"
              alt="Knot To Detail Logo"
              className="w-9 h-9 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-ink tracking-tight leading-none group-hover:text-accent transition-colors">
                Knot To Detail
              </span>
              <span className="font-mono text-[10px] text-ink-soft font-medium uppercase tracking-widest mt-1">
                Menswear Atelier
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-sans text-sm font-medium transition-colors ${
                isActive('/') ? 'text-accent font-semibold border-b-2 border-accent pb-0.5' : 'text-ink hover:text-accent'
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={`font-sans text-sm font-medium transition-colors ${
                isActive('/products') ? 'text-accent font-semibold border-b-2 border-accent pb-0.5' : 'text-ink hover:text-accent'
              }`}
            >
              {t('nav.products')}
            </Link>
            <Link
              to="/my-orders"
              className={`font-sans text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/my-orders') ? 'text-accent font-semibold border-b-2 border-accent pb-0.5' : 'text-ink hover:text-accent'
              }`}
            >
              <Package className="w-4 h-4 text-ink-soft" />
              {t('nav.orders')}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell />

            <Link
              to="/wishlist"
              aria-label="Danh sách yêu thích"
              className="p-2 text-ink hover:text-accent transition-colors block"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="p-2 text-ink hover:text-accent transition-colors relative block"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-white font-mono text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
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
                  className="flex items-center gap-2 px-3 py-1.5 bg-bg-alt hover:bg-line/20 text-ink border border-line rounded-lg transition font-sans text-xs font-semibold"
                >
                  <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-bold text-[11px] uppercase">
                    {userName.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline">{userName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-soft" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-card rounded-2xl border border-line py-2 z-50 shadow-md font-sans text-xs font-medium space-y-1">
                    <Link
                      to="/my-orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-bg-alt hover:text-accent"
                    >
                      <Package className="w-4 h-4 text-accent" /> Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/addresses"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-bg-alt hover:text-accent"
                    >
                      <User className="w-4 h-4 text-accent" /> Sổ địa chỉ giao hàng
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-bg-alt hover:text-accent"
                    >
                      <Heart className="w-4 h-4 text-accent" /> Sản phẩm yêu thích
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
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-dark text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-sm"
              >
                <User className="w-3.5 h-3.5" /> Đăng nhập
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-card px-4 py-4 space-y-3 font-sans text-sm">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-ink font-medium hover:text-accent"
          >
            Trang chủ
          </Link>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-ink font-medium hover:text-accent"
          >
            Sản phẩm
          </Link>
          <Link
            to="/my-orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-ink font-medium hover:text-accent"
          >
            Đơn hàng của tôi
          </Link>
        </div>
      )}
    </header>
  );
};
