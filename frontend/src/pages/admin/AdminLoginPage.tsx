import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { setAdminActiveSession } from '../../lib/auth-storage';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
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
        // Fallback
      }

      if (res.ok) {
        if (data.user?.role === 'CUSTOMER') {
          setError('Tài khoản của bạn không có quyền quản trị CRM.');
        } else {
          setAdminActiveSession({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
          });
          if (rememberMe) {
            localStorage.setItem('saved_admin_email', email);
          }
          navigate('/admin');
        }
      } else {
        setError(
          data.message ||
            `Đăng nhập thất bại (Mã lỗi ${res.status}). Vui lòng kiểm tra lại.`
        );
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .crm-light-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 24px;
          box-sizing: border-box;
        }

        .crm-light-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px 36px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03);
        }

        .crm-light-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .crm-light-logo {
          width: 56px;
          height: 56px;
          margin: 0 auto 14px;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
        }

        .crm-light-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .crm-light-subtitle {
          font-size: 0.82rem;
          color: #64748b;
        }

        .crm-light-field {
          margin-bottom: 20px;
        }

        .crm-light-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .crm-light-input-wrap {
          position: relative;
        }

        .crm-light-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          padding-right: 44px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .crm-light-input::placeholder {
          color: #94a3b8;
        }
        .crm-light-input:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
        }

        .crm-light-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 2px;
        }
        .crm-light-eye-btn:hover {
          color: #475569;
        }

        .crm-light-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 26px;
          font-size: 0.8rem;
        }

        .crm-light-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }
        .crm-light-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #d97706;
          cursor: pointer;
        }

        .crm-light-forgot {
          color: #d97706;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .crm-light-forgot:hover {
          text-decoration: underline;
        }

        .crm-light-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
        }
        .crm-light-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(217, 119, 6, 0.35);
          transform: translateY(-1px);
        }
        .crm-light-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .crm-light-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .crm-light-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 0.8rem;
          margin-bottom: 20px;
          line-height: 1.45;
        }

        .crm-light-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 0.78rem;
        }

        .crm-light-footer a {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }
        .crm-light-footer a:hover {
          color: #0f172a;
          text-decoration: underline;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }
        .modal-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 30px;
          max-width: 380px;
          width: 100%;
          color: #0f172a;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="crm-light-root">
        <div className="crm-light-card">
          <div className="crm-light-header">
            <img src="/logo.png" alt="KTD Logo" className="crm-light-logo" />
            <h1 className="crm-light-title">Knot To Detail CRM</h1>
            <p className="crm-light-subtitle">Hệ thống quản trị & vận hành nội bộ</p>
          </div>

          <form onSubmit={handleLogin}>
            {error && (
              <div className="crm-light-error">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div className="crm-light-field">
              <label className="crm-light-label">Email quản trị</label>
              <div className="crm-light-input-wrap">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="crm-light-input"
                  placeholder="admin@knottodetail.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="crm-light-field">
              <label className="crm-light-label">Mật khẩu</label>
              <div className="crm-light-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="crm-light-input"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="crm-light-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="crm-light-row">
              <label className="crm-light-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Duy trì đăng nhập
              </label>

              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="crm-light-forgot"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" disabled={loading} className="crm-light-btn">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <Lock size={16} /> Đăng nhập CRM
                </>
              )}
            </button>
          </form>

          <div className="crm-light-footer">
            <a href="/">← Quay lại cửa hàng</a>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="modal-overlay" onClick={() => setForgotModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Khôi phục mật khẩu CRM</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Vui lòng liên hệ Quản trị viên hệ thống (IT Admin) để được cấp lại mật khẩu truy cập CRM.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 mb-5 space-y-1">
              <div>• Email IT: <strong>admin@knottodetail.com</strong></div>
              <div>• Hotline: <strong>1900 - 8888 (Phím 9)</strong></div>
            </div>
            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};
