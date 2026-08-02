import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { setAuthToken, setRefreshToken, setUserId } from '../lib/auth-storage';

export const CustomerLoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
        
        setSuccess('Đăng nhập thành công!');
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
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
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
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-40">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 hover:text-slate-500 transition-colors py-2 px-4"
        >
          <ArrowLeft className="w-4 h-4" /> TRỞ VỀ CỬA HÀNG
        </Link>
      </div>

      <div className="mx-auto w-full max-w-[400px] lg:max-w-[1000px] relative z-10">
        
        {/* The Box */}
        <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative min-h-[650px] lg:min-h-[600px] flex flex-col lg:block">
          
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden border-b border-slate-100 relative z-30 bg-white">
            <button 
              onClick={() => { setIsLogin(true); clearMessages(); }} 
              className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${isLogin ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => { setIsLogin(false); clearMessages(); }} 
              className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${!isLogin ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Đăng ký
            </button>
          </div>

          {/* SIGN IN CONTAINER */}
          <div className={`absolute top-[65px] lg:top-0 left-0 w-full lg:w-1/2 h-[calc(100%-65px)] lg:h-full transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] px-8 sm:px-14 py-8 bg-white flex flex-col justify-center
            ${isLogin ? 'translate-x-0 opacity-100 z-20' : '-translate-x-[20%] lg:translate-x-full opacity-0 z-10 pointer-events-none'}`}>
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Đăng nhập</h2>
              <p className="text-sm text-slate-500">Chào mừng bạn trở lại với Knot To Detail.</p>
            </div>
            
            {error && isLogin && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {success && isLogin && (
              <div className="mb-6 p-3 bg-green-50 text-green-700 text-xs font-medium flex items-center gap-2 border border-green-100">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full border-b border-slate-300 bg-transparent py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border-b border-slate-300 bg-transparent py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng nhập ngay'}
                </button>
              </div>
            </form>
          </div>

          {/* SIGN UP CONTAINER */}
          <div className={`absolute top-[65px] lg:top-0 left-0 w-full lg:w-1/2 h-[calc(100%-65px)] lg:h-full transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] px-8 sm:px-14 py-8 bg-white flex flex-col justify-center
            ${isLogin ? 'translate-x-[20%] lg:translate-x-0 opacity-0 z-10 pointer-events-none' : 'translate-x-0 lg:translate-x-full opacity-100 z-20'}`}>
            
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Tạo tài khoản</h2>
              <p className="text-sm text-slate-500">Trải nghiệm mua sắm thời trang nam cao cấp.</p>
            </div>

            {error && !isLogin && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full border-b border-slate-300 bg-transparent py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full border-b border-slate-300 bg-transparent py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                  placeholder="name@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full border-b border-slate-300 bg-transparent py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full border-b border-slate-300 bg-transparent py-2 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-300"
                    placeholder="0912..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng ký tài khoản'}
                </button>
              </div>
            </form>
          </div>

          {/* OVERLAY CONTAINER (DESKTOP ONLY) */}
          <div className={`hidden lg:block absolute top-0 left-1/2 w-1/2 h-full transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] z-30 ${isLogin ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="absolute inset-0 bg-slate-900 text-white overflow-hidden">
               {/* Background Image */}
               <img 
                  src="https://images.unsplash.com/photo-1594938298598-7c87c4b69395?q=80&w=800" 
                  alt="Fashion" 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" 
               />
               
               {/* Overlay Content - Register Prompt */}
               <div className={`absolute inset-0 flex flex-col items-center justify-center p-14 text-center transition-all duration-700 ease-in-out ${isLogin ? 'opacity-100 translate-x-0 delay-100' : 'opacity-0 translate-x-[20%] pointer-events-none'}`}>
                  <h2 className="text-4xl font-serif mb-6 leading-tight">Khách hàng mới?</h2>
                  <p className="text-sm text-slate-300 mb-10 leading-relaxed font-light">Đăng ký thành viên để nhận các đặc quyền riêng biệt và trải nghiệm mua sắm chuẩn mực Quý ông.</p>
                  <button 
                    onClick={() => { setIsLogin(false); clearMessages(); }} 
                    className="px-10 py-4 border border-white/50 hover:bg-white hover:text-slate-900 transition-all uppercase tracking-[0.2em] text-[10px] font-bold"
                  >
                    Tạo tài khoản
                  </button>
               </div>

               {/* Overlay Content - Login Prompt */}
               <div className={`absolute inset-0 flex flex-col items-center justify-center p-14 text-center transition-all duration-700 ease-in-out ${!isLogin ? 'opacity-100 translate-x-0 delay-100' : 'opacity-0 -translate-x-[20%] pointer-events-none'}`}>
                  <h2 className="text-4xl font-serif mb-6 leading-tight">Đã có tài khoản?</h2>
                  <p className="text-sm text-slate-300 mb-10 leading-relaxed font-light">Đăng nhập để xem các bộ sưu tập mới nhất và quản lý đơn hàng của bạn.</p>
                  <button 
                    onClick={() => { setIsLogin(true); clearMessages(); }} 
                    className="px-10 py-4 border border-white/50 hover:bg-white hover:text-slate-900 transition-all uppercase tracking-[0.2em] text-[10px] font-bold"
                  >
                    Đăng nhập ngay
                  </button>
               </div>
            </div>
          </div>

        </div>

        {/* Footer info link */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-[11px] text-slate-500 tracking-wide">
            Dành cho nhân viên quản trị?{' '}
            <Link to="/crm" className="font-bold text-slate-900 hover:underline">
              Đăng nhập CRM
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
