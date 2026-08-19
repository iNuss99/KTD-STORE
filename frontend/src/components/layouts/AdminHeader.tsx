import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronDown, ShieldCheck, Eye, Store, Menu } from 'lucide-react';
import { NotificationBell } from '../widgets/NotificationBell';
import { useAuth, Role } from '../../hooks/useAuth';

interface AdminHeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileSidebar }) => {
  const navigate = useNavigate();
  const { role, actualRole, simulatedRole, setSimulatedRole } = useAuth();
  const [userName, setUserName] = useState<string>('Admin');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('view_as_role');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/crm');
  };

  const isSuperAdminUser = actualRole === 'SUPER_ADMIN';

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
            Bảng điều khiển hệ thống Knot To Detail Quản trị
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Super Admin Role View Switcher */}
        {isSuperAdminUser && (
          <div className="flex items-center gap-1.5 bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 text-xs px-2 sm:px-2.5 py-1.5 rounded-xl transition shadow-2xs">
            <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold hidden md:inline text-slate-700">Góc nhìn:</span>
            <select
              value={simulatedRole || 'SUPER_ADMIN'}
              onChange={(e) => setSimulatedRole(e.target.value as Role)}
              className="bg-transparent font-bold text-amber-950 text-xs border-none outline-none cursor-pointer focus:ring-0 max-w-[90px] sm:max-w-none truncate"
              title="Đổi góc nhìn giả lập vai trò (Super Admin feature)"
            >
              <option value="SUPER_ADMIN">👑 Super Admin (Tất cả quyền)</option>
              <option value="CEO">👔 CEO (Báo cáo & Nhân sự)</option>
              <option value="MANAGER">📦 Manager (Đơn hàng & Kho)</option>
              <option value="STAFF">🛠️ Staff (Vận hành đơn hàng)</option>
              <option value="CUSTOMER">🛍️ Customer (Góc nhìn Khách hàng)</option>
            </select>
          </div>
        )}

        {/* Return to Storefront Button */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs border border-slate-200/80"
          title="Quay về trang bán hàng (Storefront)"
        >
          <Store className="w-4 h-4 text-amber-600 group-hover:text-white shrink-0" />
          <span className="hidden sm:inline">Quay về trang bán hàng</span>
        </Link>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 hover:bg-slate-50 rounded-2xl transition border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
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
                <p className="text-[11px] text-slate-500 font-medium">Role thực tế: {actualRole}</p>
                {simulatedRole && (
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5">
                    Đang giả lập: {simulatedRole}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
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

