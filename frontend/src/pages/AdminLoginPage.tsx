import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

import { setAuthToken, setRefreshToken, setUserId } from '../lib/auth-storage';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Fallback for non-JSON error response
      }

      if (res.ok) {
        if (data.user?.role === 'CUSTOMER') {
          setError('Tài khoản không có quyền quản trị.');
        } else {
          setAuthToken(data.access_token);
          if (data.refresh_token) setRefreshToken(data.refresh_token);
          if (data.user) {
            setUserId(data.user.id);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_name', data.user.full_name || 'Admin');
          }
          window.dispatchEvent(new Event('auth-change'));
          navigate('/admin');
        }
      } else {
        setError(data.message || `Đăng nhập thất bại (Mã lỗi ${res.status}). Kiểm tra lại thông tin.`);
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Knot To Detail Logo"
            className="w-16 h-16 object-contain rounded-2xl shadow-lg"
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Knot To Detail <span className="text-amber-400">Admin</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Hệ thống quản trị và vận hành
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-medium text-slate-900 transition"
                  placeholder="admin@menwearhub.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-medium text-slate-900 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" /> Đăng nhập quản trị
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
