import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Ticket, 
  RotateCcw, 
  ShieldAlert, 
  ShieldCheck, 
  LogOut,
  Users,
  Package
} from 'lucide-react';
import { useAuth, Role } from '../hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  requireSuperAdmin?: boolean;
}

export const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin, role } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    navigate('/crm');
  };

  const allNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Nhân sự', path: '/admin/staff', icon: <Users className="w-4 h-4" />, allowedRoles: ['SUPER_ADMIN', 'CEO'] },
    { name: 'Đơn hàng', path: '/admin/orders', icon: <ClipboardList className="w-4 h-4" /> },
    { name: 'Đổi trả', path: '/admin/returns', icon: <RotateCcw className="w-4 h-4" /> },
    { name: 'Khuyến mãi', path: '/admin/discounts', icon: <Ticket className="w-4 h-4" /> },
    { name: 'Sản phẩm', path: '/admin/catalog', icon: <Package className="w-4 h-4" /> },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldAlert className="w-4 h-4 text-rose-500" />, requireSuperAdmin: true },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (item.requireSuperAdmin && !isSuperAdmin) return false;
    if (item.allowedRoles && role && !item.allowedRoles.includes(role) && !isSuperAdmin) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
              <img
                src="/logo.png"
                alt="Knot To Detail Logo"
                className="w-9 h-9 object-contain rounded-lg shadow-sm"
              />
              <span className="font-extrabold text-lg tracking-tight text-white">
                Knot To Detail <span className="text-amber-400">Admin</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-slate-800 text-white shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
