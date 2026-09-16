import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Camera,
  Trash2,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { getAdminAuthHeader, updateAdminProfileData, clearAdminAuth } from '../../lib/auth-storage';
import { useToast } from '../../context/ToastContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const AdminProfilePage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState('');

  // Form states - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Fetch profile on mount
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setAvatarUrl(data.avatar_url || null);
        // Sync with local storage
        updateAdminProfileData({
          full_name: data.full_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
        });
      } else {
        const err = await res.json();
        showError('Không thể tải thông tin', err.message || 'Lỗi lấy dữ liệu hồ sơ.');
      }
    } catch {
      showError('Lỗi kết nối', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle client-side avatar file upload & resize to 256x256 WebP
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('File không hợp lệ', 'Vui lòng chọn định dạng hình ảnh (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File quá lớn', 'Kích thước ảnh tối đa là 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
          setAvatarUrl(compressedDataUrl);
          setAvatarSuccessMsg('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setAvatarSuccessMsg('');
  };

  // Submit Avatar update
  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setAvatarSuccessMsg('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({
          avatar_url: avatarUrl,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setAvatarUrl(updated.avatar_url || null);
        updateAdminProfileData({
          avatar_url: updated.avatar_url,
        });
        setAvatarSuccessMsg('Cập nhật ảnh đại diện thành công!');
        showSuccess('Thành công', 'Đã lưu ảnh đại diện mới.');
      } else {
        const err = await res.json();
        showError('Thất bại', err.message || 'Lỗi cập nhật ảnh đại diện');
      }
    } catch {
      showError('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setSavingAvatar(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (res.ok) {
        setPasswordSuccessMsg('Đổi mật khẩu thành công! Hệ thống đang chuyển hướng về trang đăng nhập...');
        showSuccess('Thành công', 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        clearAdminAuth();
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      } else {
        const err = await res.json();
        setPasswordErrorMsg(err.message || 'Không thể đổi mật khẩu');
        showError('Thất bại', err.message || 'Lỗi đổi mật khẩu');
      }
    } catch {
      setPasswordErrorMsg('Lỗi kết nối máy chủ');
      showError('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleBadge = (roleStr?: string) => {
    switch (roleStr) {
      case 'SUPER_ADMIN':
        return { label: '👑 Super Admin', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'CEO':
        return { label: '👔 CEO Executive', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'MANAGER':
        return { label: '📦 Quản lý (Manager)', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'STAFF':
        return { label: '🛠️ Nhân viên (Staff)', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { label: roleStr || 'Admin', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Đang tải hồ sơ nhân sự...
        </p>
      </div>
    );
  }

  const roleInfo = getRoleBadge(profile?.role);
  const hasAvatarChanged = avatarUrl !== (profile?.avatar_url || null);

  return (
    <div className="max-w-4xl mx-auto font-sans space-y-6 pb-12 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-amber-600" />
            Hồ Sơ Cá Nhân Nhân Sự
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thông tin tài khoản được quản lý bảo mật bởi Super Admin. Bạn có thể cập nhật ảnh đại diện và thay đổi mật khẩu truy cập.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs inline-flex items-center gap-1.5 ${roleInfo.bg}`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {roleInfo.label}
          </span>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('change-password-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Đổi mật khẩu
          </button>
        </div>
      </div>

      {/* Avatar Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Camera className="w-4 h-4 text-amber-600" />
          Ảnh Đại Diện (Avatar)
        </h2>

        {avatarSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{avatarSuccessMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.full_name || 'Avatar'}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-amber-500/40 shadow-md ring-4 ring-amber-50"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-md ring-4 ring-slate-100">
                {(profile?.full_name || profile?.email || 'A').charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg transition border-2 border-white cursor-pointer"
              title="Thay đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Controls & Guidelines */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Tải lên hình ảnh đại diện của bạn</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hỗ trợ định dạng PNG, JPG, WebP (tối đa 5MB). Hệ thống tự động nén tối ưu hiển thị sắc nét trên thanh điều hướng.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" /> Chọn ảnh mới
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa avatar
                </button>
              )}

              {hasAvatarChanged && (
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 animate-pulse"
                >
                  {savingAvatar ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Lưu ảnh đại diện
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Details (Locked / Read-only) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Thông Tin Cơ Bản
          </h2>
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" /> Cố định theo hồ sơ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name (Read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Họ và tên nhân sự
              </label>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Không thể thay đổi
              </span>
            </div>
            <input
              type="text"
              value={profile?.full_name || ''}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-text"
            />
          </div>

          {/* Phone (Read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Số điện thoại liên hệ
              </label>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Không thể thay đổi
              </span>
            </div>
            <input
              type="text"
              value={profile?.phone || 'Chưa cập nhật'}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-text"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email đăng nhập
              </label>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Không thể thay đổi
              </span>
            </div>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-text"
            />
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Vai trò / Chức vụ
              </label>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Phân quyền bởi Super Admin
              </span>
            </div>
            <input
              type="text"
              value={roleInfo.label}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-text"
            />
          </div>
        </div>

        {/* Created At Info */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày tạo tài khoản:
          </span>
          <span className="font-semibold text-slate-700">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A'}
          </span>
        </div>

        {/* Security Policy Notice */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Thông tin định danh nhân sự (Họ tên, SĐT, Email, Vai trò) được quản lý tập trung bởi Super Admin để đảm bảo an ninh hệ thống. Vui lòng liên hệ quản trị viên cấp cao nếu cần điều chỉnh.
          </span>
        </div>
      </div>

      {/* Change Password Card */}
      <form
        id="change-password-section"
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5 animate-fade-in"
      >
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Đổi Mật Khẩu Đăng Nhập
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Để đảm bảo an toàn tài khoản CRM, mật khẩu mới phải có ít nhất 6 ký tự.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Được phép đổi mật khẩu
          </span>
        </div>

        {passwordSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        <div className="max-w-xl space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu bạn đang dùng"
                required
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 text-amber-400" />
              )}
              Cập Nhật Mật Khẩu
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
