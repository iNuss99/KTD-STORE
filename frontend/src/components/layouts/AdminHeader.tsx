import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronDown, ShieldCheck, Store, Menu, User } from 'lucide-react';
import { NotificationBell } from '../widgets/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { clearAdminAuth, getAdminName, getAdminAvatar } from '../../lib/auth-storage';

interface AdminHeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileSidebar }) => {
  const navigate = useNavigate();
  const { role, actualRole } = useAuth();
  const [userName, setUserName] = useState<string>('Admin');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Clear any leftover role simulation from local storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('view_as_role');
    }

    const updateUserData = () => {
      const storedName = getAdminName() || localStorage.getItem('user_name');
      if (storedName) {
        setUserName(storedName);
      }
      const storedAvatar = getAdminAvatar();
      setUserAvatar(storedAvatar);
    };
    updateUserData();
    window.addEventListener('admin-auth-change', updateUserData);
    return () => window.removeEventListener('admin-auth-change', updateUserData);
  }, []);

  const handleLogout = () => {
    clearAdminAuth();
    navigate('/crm');
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none font-sans">
      {/* Left: Mobile Menu Toggle & Greeting */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden focus:outline-none transition shrink-0"
          title="Mở menu quản trị"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
            Welcome {userName}! <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Bảng điều khiển hệ thống KTDL Quản trị
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Return to Storefront Button */}
        <button
          onClick={() => {
            navigate('/');
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs border border-slate-200/80 cursor-pointer"
          title="Quay về trang bán hàng để trải nghiệm mua sắm (Storefront)"
        >
          <Store className="w-4 h-4 text-amber-600 group-hover:text-white shrink-0" />
          <span className="hidden sm:inline">Quay về trang bán hàng</span>
        </button>

        {/* Notification Bell */}
        <NotificationBell isAdmin={true} />

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 hover:bg-slate-50 rounded-2xl transition border border-transparent hover:border-slate-200 cursor-pointer"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
              <p className="text-[10px] font-semibold text-sky-600 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> {role || 'ADMIN'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">{userName}</p>
                <p className="text-[11px] text-slate-500 font-medium">Vai trò: {actualRole || role}</p>
              </div>
              <Link
                to="/admin/profile"
                onClick={() => setShowUserMenu(false)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50/60 hover:text-amber-700 transition text-left"
              >
                <User className="w-4 h-4 text-amber-600" /> Hồ sơ cá nhân
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left border-t border-slate-100/80 mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Đăng xuất hệ thống
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

