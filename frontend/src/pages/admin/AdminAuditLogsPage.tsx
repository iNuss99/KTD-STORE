import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, ChevronLeft, ChevronRight, User, Calendar, Code, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAuthHeader } from '../../lib/auth-storage';

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
  details?: any;
  performedBy: {
    id?: string;
    fullName: string;
    email?: string;
    role?: string;
  };
}

export const AdminAuditLogsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async (p = 1) => {
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      let url = `/api/audit-logs?page=${p}&limit=15`;
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      if (entityFilter) url += `&entity=${encodeURIComponent(entityFilter)}`;

      const res = await fetch(url, {
        headers: getAuthHeader(),
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setLastPage(data.lastPage || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full text-center">
        <div className="bg-white rounded-3xl p-12 max-w-lg mx-auto border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">403 - Quyền truy cập bị từ chối</h2>
          <p className="text-sm text-slate-500">
            Chức năng xem Nhật ký hệ thống (Audit Logs) chỉ dành riêng cho tài khoản Quản trị cấp cao (Super Admin).
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-amber-600" />
              Audit Logs Nhật ký Hệ thống
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Giám sát toàn bộ thao tác thay đổi dữ liệu, đơn hàng, tài khoản và hệ thống (Super Admin).
            </p>
          </div>

          <button
            onClick={() => fetchLogs(page)}
            className="self-start md:self-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Lọc theo hành động (VD: CREATE_ORDER, LOCK_USER)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Lọc theo Entity (VD: Order, User, Product)..."
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Người thực hiện</th>
                  <th className="py-3.5 px-4">Hành động</th>
                  <th className="py-3.5 px-4">Đối tượng (Entity)</th>
                  <th className="py-3.5 px-4">Dữ liệu chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Đang tải nhật ký hệ thống...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Không tìm thấy nhật ký nào khớp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{log.performedBy?.fullName || 'Hệ thống'}</span>
                          {log.performedBy?.role && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {log.performedBy.role}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-700">
                          {log.entity} {log.entityId && `#${log.entityId.substring(0, 8)}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-indigo-600 hover:underline inline-flex items-center gap-1 text-[11px]">
                              <Code className="w-3 h-3" /> Xem JSON
                            </summary>
                            <pre className="mt-2 p-2 bg-slate-900 text-emerald-400 text-[10px] rounded-lg overflow-x-auto max-w-md">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs text-slate-500">
            <div>
              Hiển thị <span className="font-bold text-slate-700">{logs.length}</span> / {total} bản ghi
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-700">
                Trang {page} / {lastPage}
              </span>
              <button
                disabled={page >= lastPage}
                onClick={() => fetchLogs(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
