import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Package, Heart, LogOut, ChevronDown } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../hooks/useCart';

import { getAuthToken, clearAuthToken } from '../lib/auth-storage';

export const Navbar: React.FC = () => {
  const { data: cart } = useCart();
  const cartCount = cart?.items?.length || 0;
  const { lang, currency, setLang, setCurrency, t } = useLanguage();
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" title="Về trang chủ Knot To Detail">
            <img
              src="/logo.png"
              alt="Knot To Detail Logo"
              className="w-9 h-9 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-lg text-slate-900 tracking-tight leading-none group-hover:text-stitch transition-colors">
                Knot To Detail
              </span>
              <span className="font-mono text-[10px] text-stitch font-bold uppercase tracking-widest mt-0.5">
                Menswear Atelier
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="font-sans text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-amber-600 transition-colors">
              {t('nav.products')}
            </Link>
            <Link to="/my-orders" className="font-sans text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600" />
              {t('nav.orders')}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language & Currency Selector */}
            <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                className="px-2 py-0.5 font-bold text-slate-800 hover:text-amber-600 transition"
                title="Đổi ngôn ngữ / Change Language"
              >
                {lang.toUpperCase()}
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setCurrency(currency === 'VND' ? 'USD' : 'VND')}
                className="px-2 py-0.5 font-bold text-slate-800 hover:text-amber-600 transition"
                title="Đổi tiền tệ / Change Currency"
              >
                {currency}
              </button>
            </div>

            <NotificationBell />

            <Link
              to="/wishlist"
              aria-label="Danh sách yêu thích"
              className="p-2 text-slate-700 hover:text-amber-600 transition-colors block"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="p-2 text-slate-700 hover:text-amber-600 transition-colors relative block"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-amber-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account Status / Login Button */}
            {userName ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-900 border border-slate-200 rounded-lg transition font-sans text-xs font-bold"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] uppercase">
                    {userName.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{userName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 py-2 z-50 shadow-lg font-sans text-xs font-medium space-y-1">
                    <Link
                      to="/my-orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                    >
                      <Package className="w-4 h-4 text-amber-600" /> Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/addresses"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                    >
                      <User className="w-4 h-4 text-amber-600" /> Sổ địa chỉ giao hàng
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                    >
                      <Heart className="w-4 h-4 text-amber-600" /> Sản phẩm yêu thích
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-xs"
              >
                <User className="w-4 h-4" /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
