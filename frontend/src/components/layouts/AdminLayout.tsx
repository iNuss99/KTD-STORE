import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { getAdminAuthToken, getAdminRole } from '../../lib/auth-storage';

export const AdminLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = getAdminAuthToken();
      const roleVal = getAdminRole();

      if (token && roleVal && ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'].includes(roleVal)) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAdminAuth();
    window.addEventListener('admin-auth-change', checkAdminAuth);
    return () => {
      window.removeEventListener('admin-auth-change', checkAdminAuth);
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/crm" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans antialiased text-slate-800 relative">
      <AdminSidebar
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen w-full">
        <AdminHeader onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

