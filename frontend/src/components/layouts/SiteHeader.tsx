import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Package, Heart, LogOut, ChevronDown, Menu, X, ShieldCheck } from 'lucide-react';
import { NotificationBell } from '../widgets/NotificationBell';
import { SearchAutocomplete } from '../widgets/SearchAutocomplete';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../hooks/useCart';
import { getAuthToken, clearAuthToken } from '../../lib/auth-storage';

export const SiteHeader: React.FC = () => {
  const { data: cart } = useCart();
  const cartCount = cart?.items?.length || 0;
  const { lang, currency, setLang, setCurrency, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkAuth = () => {
    const token = getAuthToken();
    if (token) {
      const storedRole = localStorage.getItem('user_role');
      const storedName = localStorage.getItem('user_name');
      const userStr = localStorage.getItem('user');

      let role = storedRole;
      if (!role && userStr) {
        try {
          const u = JSON.parse(userStr);
          role = u.role;
        } catch {}
      }

      const staffRoles = ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'];
      setIsAdminUser(Boolean(role && staffRoles.includes(role)));

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
      setIsAdminUser(false);
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
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-line font-sans transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0" title="Knot To Detail">
            <img
              src="/logo.png"
              alt="Knot To Detail Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-xl text-ink tracking-tight leading-none group-hover:text-accent transition-colors">
                Knot To Detail
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] text-ink-soft font-medium uppercase tracking-wider sm:tracking-widest mt-0.5">
                Menswear
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-6 shrink-0">
            <Link
              to="/"
              className={`font-sans text-sm font-medium transition-colors ${
                isActive('/') ? 'text-[#d97706] font-bold border-b-2 border-[#d97706] pb-0.5' : 'text-ink hover:text-[#d97706]'
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={`font-sans text-sm font-medium transition-colors ${
                isActive('/products') ? 'text-[#d97706] font-bold border-b-2 border-[#d97706] pb-0.5' : 'text-ink hover:text-[#d97706]'
              }`}
            >
              {t('nav.products')}
            </Link>
            <Link
              to="/my-orders"
              className={`font-sans text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/my-orders') ? 'text-[#d97706] font-bold border-b-2 border-[#d97706] pb-0.5' : 'text-ink hover:text-[#d97706]'
              }`}
            >
              <Package className="w-4 h-4 text-ink-soft" />
              {t('nav.orders')}
            </Link>
          </nav>

          {/* Search Bar Autocomplete (Desktop & Tablet) */}
          <div className="hidden sm:block flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <SearchAutocomplete />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <NotificationBell />

            <Link
              to="/wishlist"
              aria-label="Danh sách yêu thích"
              className="p-1.5 sm:p-2 text-ink hover:text-[#d97706] transition-colors block"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="p-1.5 sm:p-2 text-ink hover:text-[#d97706] transition-colors relative block"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-[#d97706] text-white font-mono text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Quick Entry Button for Admin/Staff Roles */}
            {isAdminUser && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold rounded-lg transition-all shadow-xs border border-slate-800"
                title="Quay lại Bảng điều khiển Quản trị Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Quản trị Admin</span>
              </Link>
            )}

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
                    {isAdminUser && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 font-bold rounded-t-xl"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" /> Trang quản trị (Admin)
                        </Link>
                        <div className="my-1 border-t border-line" />
                      </>
                    )}
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
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white font-sans text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-colors shadow-xs shrink-0"
              >
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Đăng nhập</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-ink hover:bg-bg-alt rounded-lg transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-card px-4 py-4 space-y-3 font-sans text-sm shadow-lg animate-fade-in">
          {/* Mobile Search */}
          <div className="pb-2">
            <SearchAutocomplete onSearchSubmitted={() => setMobileMenuOpen(false)} />
          </div>

          {isAdminUser && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 px-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200/60"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Trang quản trị (Admin Dashboard)
            </Link>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 font-medium ${isActive('/') ? 'text-[#d97706] font-bold' : 'text-ink'}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 font-medium ${isActive('/products') ? 'text-[#d97706] font-bold' : 'text-ink'}`}
          >
            Tất cả sản phẩm
          </Link>
          <Link
            to="/my-orders"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 py-2 font-medium ${isActive('/my-orders') ? 'text-[#d97706] font-bold' : 'text-ink'}`}
          >
            <Package className="w-4 h-4 text-[#d97706]" /> Đơn hàng của tôi
          </Link>
          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 py-2 font-medium ${isActive('/wishlist') ? 'text-[#d97706] font-bold' : 'text-ink'}`}
          >
            <Heart className="w-4 h-4 text-[#d97706]" /> Sản phẩm yêu thích
          </Link>

          {userName && (
            <div className="pt-2 border-t border-line flex items-center justify-between">
              <span className="text-xs font-bold text-ink truncate">Tài khoản: {userName}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-coral hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
