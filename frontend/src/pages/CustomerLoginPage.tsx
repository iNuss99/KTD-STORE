import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { setAuthToken, setRefreshToken, setUserId } from '../lib/auth-storage';

export const CustomerLoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/products';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

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
        setAuthToken(data.access_token);
        if (data.refresh_token) setRefreshToken(data.refresh_token);
        if (data.user) {
          setUserId(data.user.id);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('user_role', data.user.role || 'CUSTOMER');
          localStorage.setItem('user_name', data.user.full_name || email.split('@')[0]);
        }
        window.dispatchEvent(new Event('auth-change'));

        setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          if (data.user?.role && data.user.role !== 'CUSTOMER') {
            navigate('/admin');
          } else {
            navigate(from);
          }
        }, 600);
      } else {
        setError(data.message || 'Email hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone: phone || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Tạo tài khoản thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setPassword('');
      } else {
        const errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        setError(errorMsg || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .friendly-customer-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          width: 100%;
          background-color: #f8fafc;
          color: #0f172a;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 16px 60px;
          position: relative;
          box-sizing: border-box;
        }

        .back-nav {
          position: absolute;
          top: 14px;
          left: 16px;
          z-index: 50;
        }
        @media (min-width: 640px) {
          .back-nav {
            top: 24px;
            left: 24px;
          }
        }
        .back-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }
        .back-link-btn:hover {
          color: #d97706;
          border-color: #fcd34d;
        }

        .friendly-card-box {
          width: 100%;
          max-width: 1000px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.06);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          .friendly-card-box {
            display: block;
            min-height: 620px;
            border-radius: 20px;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07);
          }
        }

        /* Mobile Nav Tabs */
        .mobile-tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          position: relative;
          z-index: 30;
        }
        @media (min-width: 1024px) {
          .mobile-tabs { display: none; }
        }
        .tab-btn {
          flex: 1;
          padding: 14px;
          font-size: 0.88rem;
          font-weight: 700;
          border: none;
          background: none;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .tab-btn.active {
          color: #d97706;
          border-bottom: 2px solid #d97706;
        }

        /* Form Pane Base */
        .form-pane {
          position: relative;
          top: 0;
          left: 0;
          width: 100%;
          padding: 24px 20px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          box-sizing: border-box;
          transition: transform 0.7s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.7s cubic-bezier(0.76, 0, 0.24, 1);
        }
        .form-pane.pane-inactive-mobile {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .form-pane {
            position: absolute;
            top: 0;
            width: 50%;
            height: 100%;
            padding: 48px 56px;
            justify-content: center;
          }
          .form-pane.pane-inactive-mobile {
            display: flex !important;
          }
        }

        .pane-brand-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .pane-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 8px;
        }
        .pane-brand-name {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .pane-brand-name span {
          color: #d97706;
        }

        .form-header-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        @media (min-width: 640px) {
          .form-header-title { font-size: 1.85rem; }
        }
        .form-header-sub {
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 18px;
        }

        /* Input styling */
        .friendly-field {
          margin-bottom: 14px;
        }
        .friendly-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }
        .friendly-input-wrap {
          position: relative;
        }
        .friendly-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          padding-right: 44px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.92rem;
          color: #0f172a;
          outline: none;
          transition: all 0.2s ease;
        }
        .friendly-input::placeholder {
          color: #94a3b8;
        }
        .friendly-input:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
        }

        .pwd-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
        }
        .pwd-toggle:hover { color: #d97706; }

        .friendly-btn-submit {
          width: 100%;
          padding: 14px;
          margin-top: 10px;
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
        }
        .friendly-btn-submit:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(217, 119, 6, 0.35);
          transform: translateY(-1px);
        }

        /* Sliding Overlay Panel for Desktop */
        .overlay-sliding-panel {
          display: none;
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          background: #0f172a;
          color: #ffffff;
          overflow: hidden;
          z-index: 30;
          transition: transform 0.7s cubic-bezier(0.76, 0, 0.24, 1);
        }
        @media (min-width: 1024px) {
          .overlay-sliding-panel { display: block; }
        }

        .overlay-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.65) contrast(1.05);
          transition: transform 8s ease;
        }
        .overlay-sliding-panel:hover .overlay-bg-img {
          transform: scale(1.04);
        }

        .overlay-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.88) 100%);
        }

        .overlay-content-box {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          text-align: center;
          z-index: 10;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .overlay-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 14px;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .overlay-title span {
          color: #f59e0b;
        }

        .overlay-desc {
          font-size: 0.92rem;
          color: #cbd5e1;
          line-height: 1.6;
          max-width: 360px;
          margin-bottom: 32px;
        }

        .overlay-btn-switch {
          padding: 13px 32px;
          border: 2px solid #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .overlay-btn-switch:hover {
          background: #f59e0b;
          color: #0f172a;
          border-color: #f59e0b;
        }

        .alert-message-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 0.84rem;
          margin-bottom: 18px;
          line-height: 1.45;
        }
      `}</style>

      <div className="friendly-customer-root">
        {/* Back Link */}
        <div className="back-nav">
          <Link to="/products" className="back-link-btn">
            <ArrowLeft size={16} /> Trở Về Cửa Hàng
          </Link>
        </div>

        {/* Main Card Box */}
        <div className="friendly-card-box">
          {/* Mobile Tabs */}
          <div className="mobile-tabs">
            <button
              onClick={() => { setIsLogin(true); clearMessages(); }}
              className={`tab-btn ${isLogin ? 'active' : ''}`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); clearMessages(); }}
              className={`tab-btn ${!isLogin ? 'active' : ''}`}
            >
              Tạo Tài Khoản
            </button>
          </div>

          {/* SIGN IN PANE */}
          <div
            className={`form-pane ${
              isLogin
                ? 'translate-x-0 opacity-100 z-20'
                : 'pane-inactive-mobile -translate-x-[20%] lg:translate-x-full opacity-0 z-10 pointer-events-none'
            }`}
          >
            <div className="pane-brand-header">
              <img src="/logo.png" alt="KTD Logo" className="pane-logo" />
              <div className="pane-brand-name">Knot To <span>Detail</span></div>
            </div>

            <div className="mb-2">
              <h2 className="form-header-title">Đăng Nhập</h2>
              <p className="form-header-sub">
                Chào mừng bạn trở lại với Knot To Detail.
              </p>
            </div>

            {error && isLogin && (
              <div className="alert-message-box bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && isLogin && (
              <div className="alert-message-box bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="friendly-field">
                <label className="friendly-label">Địa chỉ Email *</label>
                <div className="friendly-input-wrap">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="friendly-input"
                    placeholder="vd: name@gmail.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="friendly-field">
                <label className="friendly-label">Mật khẩu *</label>
                <div className="friendly-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="friendly-input"
                    placeholder="Nhập mật khẩu của bạn"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="friendly-btn-submit">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng Nhập Ngay'}
              </button>
            </form>
          </div>

          {/* SIGN UP PANE */}
          <div
            className={`form-pane ${
              isLogin
                ? 'pane-inactive-mobile translate-x-[20%] lg:translate-x-0 opacity-0 z-10 pointer-events-none'
                : 'translate-x-0 lg:translate-x-full opacity-100 z-20'
            }`}
          >
            <div className="pane-brand-header">
              <img src="/logo.png" alt="KTD Logo" className="pane-logo" />
              <div className="pane-brand-name">Knot To <span>Detail</span></div>
            </div>

            <div className="mb-2">
              <h2 className="form-header-title">Tạo Tài Khoản</h2>
              <p className="form-header-sub">
                Trải nghiệm mua sắm thời trang nam cao cấp cùng KTD.
              </p>
            </div>

            {error && !isLogin && (
              <div className="alert-message-box bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="friendly-field">
                <label className="friendly-label">Họ và tên *</label>
                <div className="friendly-input-wrap">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="friendly-input"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="friendly-field">
                <label className="friendly-label">Địa chỉ Email *</label>
                <div className="friendly-input-wrap">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="friendly-input"
                    placeholder="vd: name@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="friendly-field">
                  <label className="friendly-label">Mật khẩu *</label>
                  <div className="friendly-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="friendly-input"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    />
                  </div>
                </div>

                <div className="friendly-field">
                  <label className="friendly-label">Số điện thoại</label>
                  <div className="friendly-input-wrap">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="friendly-input"
                      placeholder="0912..."
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="friendly-btn-submit">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng Ký Tài Khoản'}
              </button>
            </form>
          </div>

          {/* SLIDING OVERLAY PANEL (DESKTOP ONLY) */}
          <div
            className={`overlay-sliding-panel ${
              isLogin ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <img
              src="/atelier_fashion_editorial.png"
              alt="Fashion Editorial"
              className="overlay-bg-img"
            />
            <div className="overlay-vignette" />

            {/* Prompt for Sign Up */}
            <div
              className={`overlay-content-box ${
                isLogin
                  ? 'opacity-100 translate-x-0 delay-100'
                  : 'opacity-0 translate-x-[20%] pointer-events-none'
              }`}
            >
              <h2 className="overlay-title">
                Khách Hàng <span>Mới?</span>
              </h2>
              <p className="overlay-desc">
                Đăng ký tài khoản để nhận thêm nhiều ưu đãi thành viên và trải nghiệm mua sắm tuyệt vời.
              </p>
              <button
                onClick={() => { setIsLogin(false); clearMessages(); }}
                className="overlay-btn-switch"
              >
                Tạo Tài Khoản
              </button>
            </div>

            {/* Prompt for Sign In */}
            <div
              className={`overlay-content-box ${
                !isLogin
                  ? 'opacity-100 translate-x-0 delay-100'
                  : 'opacity-0 -translate-x-[20%] pointer-events-none'
              }`}
            >
              <h2 className="overlay-title">
                Đã Có <span>Tài Khoản?</span>
              </h2>
              <p className="overlay-desc">
                Đăng nhập ngay để xem giỏ hàng, theo dõi đơn hàng và cập nhật sản phẩm mới nhất.
              </p>
              <button
                onClick={() => { setIsLogin(true); clearMessages(); }}
                className="overlay-btn-switch"
              >
                Đăng Nhập Ngay
              </button>
            </div>
          </div>
        </div>

        {/* Footer info link */}
        <div className="mt-6 text-center relative z-10">
          <p className="text-xs text-slate-500 tracking-wide">
            Dành cho nhân viên quản trị?{' '}
            <Link to="/admin/login" className="font-bold text-amber-700 hover:underline">
              Đăng nhập CRM
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};
