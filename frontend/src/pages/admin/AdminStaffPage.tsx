import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Plus, ShieldCheck, Lock, Unlock, Loader2, Trash2, UserPlus, X, Pencil, Save, Mail, Copy, Check, KeyRound } from 'lucide-react';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { useAuth } from '../../hooks/useAuth';
import { getAdminAuthHeader } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

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
  const { showSuccess, showError } = useToast();
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

  // Edit Staff Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    role: 'STAFF',
    password: '',
  });

  // Resend credentials state
  const [resendLoading, setResendLoading] = useState<string | null>(null);
  const [credentialResult, setCredentialResult] = useState<{
    email: string;
    tempPassword: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResendCredentials = async (user: User) => {
    if (!window.confirm(`Bạn có chắc chắn muốn cấp lại mật khẩu mới và gửi email thông tin đăng nhập cho nhân sự "${user.full_name}" (${user.email})?`)) {
      return;
    }
    setResendLoading(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/resend-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setCredentialResult({
          email: data.email,
          tempPassword: data.tempPassword,
          message: data.message,
        });
        showSuccess(
          'Đã gửi email đăng nhập',
          `Đã cấp mật khẩu mới và gửi thông tin đến ${data.email}.`
        );
        fetchStaff();
      } else {
        showError('Gửi email thất bại', data.message || 'Không thể cấp lại thông tin đăng nhập.');
      }
    } catch {
      showError('Lỗi kết nối', 'Không thể kết nối đến máy chủ.');
    } finally {
      setResendLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditError('');
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'STAFF',
      password: '',
    });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError('');

    try {
      const payload: any = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim() || undefined,
        role: editForm.role,
      };
      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 6) {
          setEditError('Mật khẩu mới phải có ít nhất 6 ký tự');
          setEditLoading(false);
          return;
        }
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingUser(null);
        fetchStaff();
        showSuccess(
          'Cập nhật thành công',
          'Đã cập nhật hồ sơ và gửi email thông báo cho nhân sự.'
        );
      } else {
        const data = await res.json();
        setEditError(data.message || 'Không thể cập nhật thông tin nhân sự.');
      }
    } catch {
      setEditError('Lỗi kết nối máy chủ');
    } finally {
      setEditLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let pass = 'Ktd@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
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
        showSuccess(
          'Tạo nhân sự thành công',
          'Đã tạo tài khoản và gửi email thông tin đăng nhập cho nhân sự mới.'
        );
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
          ...getAdminAuthHeader(),
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
            ...getAdminAuthHeader(),
          },
          body: JSON.stringify({ is_locked: type === 'lock' }),
        });
        if (res.ok) {
          setConfirmModal({ type: null, user: null, loading: false });
          fetchStaff();
          showSuccess(
            type === 'lock' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
            type === 'lock'
              ? 'Tài khoản nhân sự đã tạm khóa và gửi email thông báo.'
              : 'Tài khoản nhân sự đã được kích hoạt lại và gửi email thông báo.'
          );
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
            ...getAdminAuthHeader(),
          },
        });
        if (res.ok) {
          setConfirmModal({ type: null, user: null, loading: false });
          fetchStaff();
          showSuccess('Đã xóa nhân sự', 'Tài khoản nhân sự đã được gỡ bỏ khỏi hệ thống.');
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
                        onClick={() => openEditModal(user)}
                        className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Mật khẩu khởi tạo</label>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, password: generateRandomPassword() })}
                      className="text-[11px] text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                    >
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập hoặc để trống để tự động tạo"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium font-mono"
                  />
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">
                    📧 Mật khẩu này sẽ được gửi trực tiếp đến email của nhân sự.
                  </p>
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

      {/* Edit Staff Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-100 select-none">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Chỉnh sửa nhân sự</h3>
                  <p className="text-xs text-slate-500 font-medium">Cập nhật hồ sơ hoặc đặt lại mật khẩu cho nhân sự.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              {/* Email (Read-only reference) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100/80 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên nhân sự *</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                />
              </div>

              {/* Phone & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò / Chức vụ *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium bg-white"
                  >
                    <option value="STAFF">STAFF (Nhân viên)</option>
                    <option value="MANAGER">MANAGER (Quản lý)</option>
                    {isSuperAdmin && <option value="CEO">CEO (Giám đốc)</option>}
                    {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
                  </select>
                </div>
              </div>

              {/* Reset Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Đặt lại mật khẩu mới (tùy chọn)</label>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, password: generateRandomPassword() })}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Để trống nếu không muốn đổi mật khẩu"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Chỉ điền vào trường này khi bạn muốn cấp lại mật khẩu đăng nhập mới cho nhân sự.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  disabled={resendLoading === editingUser.id || editLoading}
                  onClick={() => handleResendCredentials(editingUser)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Tự động cấp mật khẩu mới và gửi email ngay tức thì"
                >
                  {resendLoading === editingUser.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  Cấp lại & Gửi email mật khẩu
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    disabled={editLoading}
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                  </button>
                </div>
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
                  Bạn có chắc chắn muốn thực hiện thao tác này cho <b>{confirmModal.user.full_name}</b>?
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

      {/* Credential Result Modal (Mật khẩu mới được cấp) */}
      {credentialResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100 select-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Cấp lại mật khẩu thành công</h3>
                <p className="text-xs text-slate-500 font-medium">Hệ thống đã gửi thông tin đăng nhập tới email.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 mb-4">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Email nhận thông tin:</span>
                <span className="text-sm font-bold text-slate-800">{credentialResult.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1">Mật khẩu mới khởi tạo:</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded-xl text-base font-bold font-mono text-amber-700 select-all">
                    {credentialResult.tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentialResult.tempPassword)}
                    className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center gap-1 text-xs font-bold shadow-sm cursor-pointer"
                    title="Sao chép mật khẩu"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-6">
              💡 <b>Lưu ý:</b> Ngoài việc hệ thống đã gửi email đến hộp thư, bạn có thể bấm <b>Sao chép</b> mật khẩu ở trên để gửi trực tiếp cho nhân sự qua tin nhắn bảo mật (Zalo/Telegram/Slack) nếu cần gấp.
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCredentialResult(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
