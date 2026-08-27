import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, PhoneCall } from 'lucide-react';
import { Category } from '../../types';

export const SiteFooter: React.FC = () => {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await fetch('/api/categories/tree');
      return res.ok ? res.json() : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <footer className="bg-white border-t border-[#1A1A1A]/10 text-[#1A1A1A] font-sans pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-[#1A1A1A]/10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#F5F2EE] border border-[#C8A96E]/40 text-[#C8A96E]">
              <Truck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-editorial font-bold text-lg text-[#1A1A1A] mb-1">Vận chuyển toàn quốc</h4>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">Giao hàng hỏa tốc trong 24h-48h toàn quốc</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#F5F2EE] border border-[#C8A96E]/40 text-[#C8A96E]">
              <RefreshCw className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-editorial font-bold text-lg text-[#1A1A1A] mb-1">Đổi trả 30 ngày</h4>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">Đổi mẫu hoặc đổi size miễn phí tận nhà</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#F5F2EE] border border-[#C8A96E]/40 text-[#C8A96E]">
              <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-editorial font-bold text-lg text-[#1A1A1A] mb-1">Cam kết Atelier</h4>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">100% chất liệu vải tuyển chọn chuẩn phom</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#F5F2EE] border border-[#C8A96E]/40 text-[#C8A96E]">
              <PhoneCall className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-editorial font-bold text-lg text-[#1A1A1A] mb-1">Tư vấn phong cách</h4>
              <p className="text-xs text-[#6E6E6E] leading-relaxed">Hỗ trợ phối đồ chuyên nghiệp 24/7</p>
            </div>
          </div>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-[#1A1A1A]/10">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full border border-[#C8A96E] bg-white flex items-center justify-center text-[#C8A96E] font-editorial font-bold text-base">
                K
              </div>
              <span className="font-editorial font-bold text-2xl text-[#1A1A1A] tracking-tight">KNOT TO DETAIL</span>
            </Link>
            <p className="text-xs text-[#6E6E6E] leading-relaxed max-w-sm">
              Studio chuyên các dòng áo nam cao cấp phong cách tối giản editorial. Tập trung vào cắt may tinh tế, chất liệu tự nhiên và tôn vinh vóc dáng.
            </p>
            <div className="pt-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#6E6E6E] block mb-2">
                ĐĂNG KÝ NHẬN THÔNG TIN BỘ SƯU TẬP MỚI
              </span>
              <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md gap-2">
                <input
                  type="email"
                  placeholder="NHẬP EMAIL CỦA BẠN..."
                  className="flex-1 bg-[#F5F2EE] border border-[#1A1A1A]/15 px-3.5 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#C8A96E]"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A1A1A] text-white hover:bg-[#C8A96E] transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-wider"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-xs font-semibold text-[#1A1A1A] uppercase tracking-[0.2em]">BỘ SƯU TẬP</h4>
            <ul className="space-y-2 text-xs text-[#6E6E6E] font-sans">
              {categories.length > 0 ? (
                categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/products?category_id=${cat.id}`} className="hover:text-[#C8A96E] transition">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/products?category=ao-so-mi" className="hover:text-[#C8A96E] transition">Áo Sơ Mi Atelier</Link></li>
                  <li><Link to="/products?category=ao-polo" className="hover:text-[#C8A96E] transition">Áo Polo Cotton</Link></li>
                  <li><Link to="/products?category=ao-tshirt" className="hover:text-[#C8A96E] transition">Áo T-Shirt Premium</Link></li>
                  <li><Link to="/products?category=ao-khoac" className="hover:text-[#C8A96E] transition">Áo Khoác Heritage</Link></li>
                </>
              )}
              <li>
                <Link to="/products" className="hover:text-[#C8A96E] font-mono uppercase tracking-wider transition text-[#C8A96E] block pt-1">
                  TẤT CẢ SẢN PHẨM →
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-xs font-semibold text-[#1A1A1A] uppercase tracking-[0.2em]">HỖ TRỢ</h4>
            <ul className="space-y-2 text-xs text-[#6E6E6E] font-sans">
              <li><Link to="/my-orders" className="hover:text-[#C8A96E] transition">Kiểm tra đơn hàng</Link></li>
              <li><Link to="/addresses" className="hover:text-[#C8A96E] transition">Sổ địa chỉ giao hàng</Link></li>
              <li><Link to="/wishlist" className="hover:text-[#C8A96E] transition">Sản phẩm đã lưu</Link></li>
              <li><span className="hover:text-[#C8A96E] cursor-pointer">Bảng hướng dẫn chọn size</span></li>
              <li><span className="hover:text-[#C8A96E] cursor-pointer">Chính sách đổi trả 30 ngày</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-mono text-xs font-semibold text-[#1A1A1A] uppercase tracking-[0.2em]">LIÊN HỆ ATELIER</h4>
            <p className="text-xs text-[#6E6E6E] leading-relaxed">
              Showroom: 123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh
            </p>
            <p className="text-xs font-mono text-[#1A1A1A]">Hotline: 1900 8888</p>
            <p className="text-xs font-mono text-[#1A1A1A]">Email: concierge@knottodetail.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#6E6E6E] uppercase tracking-wider">
          <p>© 2026 KNOT TO DETAIL ATELIER. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6">
            <span className="hover:text-[#1A1A1A] cursor-pointer">ĐIỀU KHỎAN DỊCH VỤ</span>
            <span className="hover:text-[#1A1A1A] cursor-pointer">CHÍNH SÁCH BẢO MẬT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

