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
    <footer className="bg-bg-alt border-t border-line text-ink font-sans pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-line">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-card rounded-2xl border border-line text-accent shadow-xs">
              <Truck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-ink mb-1">Vận chuyển toàn quốc</h4>
              <p className="text-xs text-ink-soft leading-relaxed">Giao hàng hỏa tốc trong 24h-48h nội thành</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-card rounded-2xl border border-line text-accent shadow-xs">
              <RefreshCw className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-ink mb-1">Đổi trả dễ dàng</h4>
              <p className="text-xs text-ink-soft leading-relaxed">Hỗ trợ đổi trả trong 7 ngày nếu không vừa size</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-card rounded-2xl border border-line text-accent shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-ink mb-1">Cam kết chính hãng</h4>
              <p className="text-xs text-ink-soft leading-relaxed">100% chất liệu cao cấp chuẩn thiết kế</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-card rounded-2xl border border-line text-accent shadow-xs">
              <PhoneCall className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-ink mb-1">Hỗ trợ 24/7</h4>
              <p className="text-xs text-ink-soft leading-relaxed">Tư vấn chọn outfit chuyên nghiệp</p>
            </div>
          </div>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-line">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
              <span className="font-display font-bold text-xl text-ink tracking-tight">Knot To Detail</span>
            </Link>
            <p className="text-sm text-ink-soft leading-relaxed max-w-sm">
              Thương hiệu thời trang nam hiện đại, tinh tế. Tập trung vào phom dáng chuẩn, chất liệu cao cấp và sự tỉ mỉ trong từng chi tiết.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-ink-soft block mb-2">
                Đăng ký nhận thông tin bộ sưu tập mới
              </span>
              <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md gap-2">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  className="flex-1 bg-card border border-line rounded-lg px-3.5 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink text-white rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wider">Danh mục</h4>
            <ul className="space-y-2 text-xs text-ink-soft">
              {categories.length > 0 ? (
                categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/products?category_id=${cat.id}`} className="hover:text-accent transition">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/products" className="hover:text-accent transition">Áo Sơ Mi Nam</Link></li>
                  <li><Link to="/products" className="hover:text-accent transition">Áo Polo Nam</Link></li>
                  <li><Link to="/products" className="hover:text-accent transition">Quần Tây & Kaki</Link></li>
                  <li><Link to="/products" className="hover:text-accent transition">Áo Khoác Nam</Link></li>
                </>
              )}
              <li>
                <Link to="/products" className="hover:text-accent font-semibold transition text-accent">
                  Tất cả sản phẩm →
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wider">Hỗ trợ</h4>
            <ul className="space-y-2 text-xs text-ink-soft">
              <li><Link to="/my-orders" className="hover:text-accent transition">Kiểm tra đơn hàng</Link></li>
              <li><Link to="/addresses" className="hover:text-accent transition">Sổ địa chỉ</Link></li>
              <li><Link to="/wishlist" className="hover:text-accent transition">Sản phẩm yêu thích</Link></li>
              <li><span className="hover:text-accent cursor-pointer">Hướng dẫn chọn size</span></li>
              <li><span className="hover:text-accent cursor-pointer">Chính sách đổi trả</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-display font-semibold text-sm text-ink uppercase tracking-wider">Liên hệ</h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              Showroom: 123 Đường Thời Trang, Quận 1, TP. Hồ Chí Minh
            </p>
            <p className="text-xs font-mono text-ink font-medium">Hotline: 1900 8888</p>
            <p className="text-xs font-mono text-ink font-medium">Email: support@knottodetail.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-soft">
          <p>© 2026 MenWear Hub / Knot To Detail. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-ink cursor-pointer">Điều khoản dịch vụ</span>
            <span className="hover:text-ink cursor-pointer">Bảo mật thông tin</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
