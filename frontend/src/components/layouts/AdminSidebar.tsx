import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Ticket,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Users,
  Settings,
  Sparkles,
  ShoppingBag,
  Package,
} from 'lucide-react';
import { useAuth, Role } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  requireSuperAdmin?: boolean;
  tag?: string;
}

interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const location = useLocation();
  const { isSuperAdmin, role } = useAuth();

  // Strict Matrix 1.3 Role Mapping from spec.md & README.md
  const mainNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO', 'MANAGER'], // Staff & Customer do not have Báo cáo access
    },
    {
      name: 'Nhân sự',
      path: '/admin/staff',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO'], // Manager, Staff, Customer no access
    },
    {
      name: 'Đơn hàng',
      path: '/admin/orders',
      icon: <ClipboardList className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'],
    },
    {
      name: 'Đổi trả',
      path: '/admin/returns',
      icon: <RotateCcw className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'],
    },
    {
      name: 'Khuyến mãi',
      path: '/admin/discounts',
      icon: <Ticket className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO', 'MANAGER'], // Staff & Customer no access
    },
    {
      name: 'Sản phẩm',
      path: '/admin/catalog',
      icon: <Package className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'],
    },
    {
      name: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      requireSuperAdmin: true, // Only SUPER_ADMIN
    },
  ];

  const otherNavItems: NavItem[] = [
    {
      name: 'Cấu hình hệ thống',
      path: '/admin/settings',
      icon: <Settings className="w-4 h-4" />,
      allowedRoles: ['SUPER_ADMIN', 'CEO'],
    },
  ];

  const filterNavItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.requireSuperAdmin && !isSuperAdmin) return false;
      if (item.allowedRoles && role) {
        if (!item.allowedRoles.includes(role)) return false;
      }
      return true;
    });
  };

  const visibleMainItems = filterNavItems(mainNavItems);
  const visibleOtherItems = filterNavItems(otherNavItems);

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Desktop: sticky placeholder giữ chỗ trong flex row */}
      {/* Mobile: fixed overlay drawer */}
      <aside
        className={`bg-white border-r border-slate-100 flex flex-col w-64 shrink-0 select-none font-sans z-50 transition-transform duration-300 ease-in-out
          fixed inset-y-0 left-0 shadow-xl
          lg:sticky lg:top-0 lg:h-screen lg:shadow-none lg:translate-x-0
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <Link to="/admin/dashboard" onClick={handleNavClick} className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Knot To Detail Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  Knot To Detail
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-light text-accent rounded-full border border-accent-border">
                  Admin
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Control Center</p>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {/* Customer View Notice */}
          {role === 'CUSTOMER' ? (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-600" /> Góc nhìn Khách hàng
              </p>
              <p className="text-amber-800 text-[11px]">
                Tài khoản Khách hàng (Customer) không có quyền truy cập trang quản trị CRM.
              </p>
              <Link
                to="/products"
                onClick={handleNavClick}
                className="inline-block w-full text-center py-2 bg-accent hover:bg-accent-dark text-white font-bold rounded-xl text-[11px] transition shadow-xs"
              >
                Chuyển tới Cửa hàng
              </Link>
            </div>
          ) : (
            <>
              {/* MAIN MENU */}
              {visibleMainItems.length > 0 && (
                <div>
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Main Menu
                  </h3>
                  <nav className="space-y-1">
                    {visibleMainItems.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={handleNavClick}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                            isActive
                              ? 'bg-accent-light text-accent font-bold shadow-xs'
                              : 'text-ink-soft hover:text-ink hover:bg-bg-alt font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? 'text-accent' : 'text-ink-soft'}>
                              {item.icon}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          {item.tag && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-accent-light text-accent rounded-md">
                              {item.tag}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* OTHERS */}
              {visibleOtherItems.length > 0 && (
                <div>
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Others
                  </h3>
                  <nav className="space-y-1">
                    {visibleOtherItems.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={handleNavClick}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                            isActive
                              ? 'bg-amber-50 text-amber-600 font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? 'text-accent' : 'text-ink-soft'}>
                              {item.icon}
                            </span>
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {role ? role.charAt(0) : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{role || 'ADMIN'}</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Online
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

