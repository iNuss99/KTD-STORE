import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Eye, RotateCcw } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAuth } from '../../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const { isSimulating, role, setSimulatedRole } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const roleVal = localStorage.getItem('user_role');

    if (token && roleVal && ['SUPER_ADMIN', 'CEO', 'MANAGER', 'STAFF'].includes(roleVal)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
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
        {/* Yellow Warning Banner when simulating role */}
        {isSimulating && (
          <div className="bg-amber-400 text-amber-950 font-bold text-xs px-4 sm:px-6 py-2 flex items-center justify-between shadow-xs z-50">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-amber-900 shrink-0" />
              <span className="truncate">
                Chế độ Giả lập: Bạn đang trải nghiệm với góc nhìn <u>{role}</u>
              </span>
            </div>
            <button
              onClick={() => setSimulatedRole(null)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs shrink-0 ml-2"
            >
              <RotateCcw className="w-3 h-3" /> <span className="hidden sm:inline">Trở lại</span> Super Admin
            </button>
          </div>
        )}

        <AdminHeader onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

