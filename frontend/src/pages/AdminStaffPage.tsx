import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Plus, ShieldCheck, Lock, Unlock, Loader2, Trash2, UserPlus, X } from 'lucide-react';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuth } from '../hooks/useAuth';
import { getAuthHeader } from '../lib/auth-storage';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_locked: boolean;
  created_at: string;
}

export const AdminStaffPage: React.FC = () => {
  const { isSuperAdmin, isCEO, role } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STAFF',
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(createForm),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          full_name: '',
          email: '',
          password: '',
          phone: '',
          role: 'STAFF',
        });
        fetchStaff();
      } else {
        const data = await res.json();
        setCreateError(data.message || 'Không thể tạo tài khoản nhân sự.');
      }
    } catch (err) {
      setCreateError('Lỗi kết nối máy chủ');
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Lọc ra các nhân viên nội bộ (trừ CUSTOMER)
        const internalStaff = data.filter((u: User) => u.role !== 'CUSTOMER');
        setStaff(internalStaff);
      } else {
        setError('Không thể tải danh sách nhân sự');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  if (!isSuperAdmin && !isCEO) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto my-12 shadow-sm select-none">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-extrabold text-xl">
          403
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Truy cập bị từ chối</h2>
        <p className="text-xs text-slate-500 font-medium">
          Vai trò <b className="text-slate-700">{role}</b> không có quyền truy cập Quản lý Nhân sự. Trang này chỉ dành cho Super Admin và CEO.
        </p>
      </div>
    );
  }

  const [confirmModal, setConfirmModal] = useState<{
    type: 'lock' | 'unlock' | 'delete' | null;
    user: User | null;
    loading: boolean;
    error?: string;
  }>({
    type: null,
    user: null,
    loading: false,
  });

  const openLockModal = (user: User) => {
    setConfirmModal({
      type: user.is_locked ? 'unlock' : 'lock',
      user,
      loading: false,
    });
  };

  const openDeleteModal = (user: User) => {
    setConfirmModal({
      type: 'delete',
      user,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { type, user } = confirmModal;
    if (!type || !user) return;

    setConfirmModal((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      if (type === 'lock' || type === 'unlock') {
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ is_locked: type === 'lock' }),
        });
        if (res.ok) {
          setConfirmModal({ type: null, user: null, loading: false });
          fetchStaff();
        } else {
          const errorData = await res.json();
          setConfirmModal((prev) => ({
            ...prev,
            loading: false,
            error: errorData.message || 'Có lỗi xảy ra khi cập nhật trạng thái.',
          }));
        }
      } else if (type === 'delete') {
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });
        if (res.ok) {
          setConfirmModal({ type: null, user: null, loading: false });
          fetchStaff();
        } else {
          const errorData = await res.json();
          setConfirmModal((prev) => ({
            ...prev,
            loading: false,
            error: errorData.message || 'Không thể xóa tài khoản.',
          }));
        }
      }
    } catch (err) {
      setConfirmModal((prev) => ({
        ...prev,
        loading: false,
        error: 'Lỗi kết nối máy chủ',
      }));
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-600" />
            Quản lý Nhân sự
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản quản trị viên và nhân viên hệ thống.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Thêm nhân sự
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Họ tên</th>
                  <th className="py-4 px-6">Thông tin liên hệ</th>
                  <th className="py-4 px-6 text-center">Vai trò</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {staff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">{user.full_name}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium">{user.email}</div>
                      {user.phone && <div className="text-xs text-slate-500 mt-0.5">{user.phone}</div>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'CEO' ? 'bg-amber-100 text-amber-700' :
                        user.role === 'MANAGER' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        user.is_locked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {user.is_locked ? 'Đang khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openLockModal(user)}
                        className={`p-2 rounded-lg transition ${
                          user.is_locked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        }`}
                        title={user.is_locked ? 'Mở khóa' : 'Khóa tài khoản'}
                      >
                        {user.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <PermissionGuard requireSuperAdmin>
                        <button 
                          onClick={() => openDeleteModal(user)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Không tìm thấy nhân sự nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-100 select-none">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Thêm nhân sự mới</h3>
                  <p className="text-xs text-slate-500 font-medium">Tạo tài khoản truy cập hệ thống quản trị.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="nhansu@ktd.vn"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium bg-white"
                  >
                    <option value="STAFF">STAFF (Nhân viên)</option>
                    <option value="MANAGER">MANAGER (Quản lý)</option>
                    {isSuperAdmin && <option value="CEO">CEO (Giám đốc)</option>}
                    {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  disabled={createLoading}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200 transition disabled:opacity-50"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.type && confirmModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100 select-none">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                confirmModal.type === 'delete' ? 'bg-red-50 text-red-600' :
                confirmModal.type === 'lock' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {confirmModal.type === 'delete' ? <Trash2 className="w-6 h-6" /> :
                 confirmModal.type === 'lock' ? <Lock className="w-6 h-6" /> :
                 <Unlock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {confirmModal.type === 'delete' ? 'Xóa tài khoản nhân sự' :
                   confirmModal.type === 'lock' ? 'Khóa tài khoản nhân sự' :
                   'Mở khóa tài khoản'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {confirmModal.user.full_name} ({confirmModal.user.email})
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {confirmModal.type === 'delete' ? (
                <>Cảnh báo: Hành động này sẽ <strong className="text-red-600 font-bold">xóa vĩnh viễn</strong> tài khoản này khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?</>
              ) : confirmModal.type === 'lock' ? (
                <>Tài khoản bị khóa sẽ không thể đăng nhập hoặc thao tác trên hệ thống. Bạn có chắc muốn khóa tài khoản này?</>
              ) : (
                <>Mở khóa tài khoản sẽ cho phép nhân viên này tiếp tục đăng nhập và thao tác trên hệ thống.</>
              )}
            </p>

            {confirmModal.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {confirmModal.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ type: null, user: null, loading: false })}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={confirmModal.loading}
                onClick={handleConfirmAction}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                  confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                  confirmModal.type === 'lock' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                  'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {confirmModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {confirmModal.type === 'delete' ? 'Xóa vĩnh viễn' :
                 confirmModal.type === 'lock' ? 'Xác nhận khóa' :
                 'Xác nhận mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
