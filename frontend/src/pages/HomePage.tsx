import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ArrowRight, Sparkles, ShieldCheck, Flame, Tag } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { data: productsData, isLoading, isError } = useProducts({ limit: 8 });
  const products = productsData?.data || [];

  const categories = [
    {
      id: 'ao-so-mi',
      name: 'Áo Sơ Mi',
      desc: 'Phom dáng hiện đại, tối giản',
      img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
    },
    {
      id: 'ao-polo',
      name: 'Áo Polo',
      desc: 'Năng động, thoáng khí',
      img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80',
    },
    {
      id: 'quan-tay',
      name: 'Quần Tây & Kaki',
      desc: 'Lịch lãm, co giãn thoải mái',
      img: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80',
    },
    {
      id: 'ao-khoac',
      name: 'Áo Khoác',
      desc: 'Phong cách & ấm áp',
      img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&q=80',
    },
  ];

  return (
    <div className="space-y-20 pb-16 font-sans overflow-hidden">
      {/* Hero Section with Blurred Blobs & Floating Card */}
      <section className="relative min-h-[540px] lg:min-h-[620px] pt-12 lg:pt-20 pb-16 flex items-center bg-bg">
        {/* Color Blobs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-coral/15 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-line shadow-xs">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-ink">
                  Bộ Sưu Tập Thu Đông 2026
                </span>
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.1] tracking-tight">
                Phong Cách Tối Giản, <br />
                <span className="text-accent underline decoration-accent/30 underline-offset-8">
                  Tinh Tế Từng Chi Tiết
                </span>
              </h1>

              <p className="text-ink-soft text-base sm:text-lg max-w-xl font-sans leading-relaxed">
                Định hình gu thời trang nam hiện đại với chất liệu vải tuyển chọn, đường may sắc nét và phom dáng vừa vặn hoàn hảo.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/products"
                  className="px-8 py-3.5 rounded-full bg-accent hover:bg-accent-dark text-white font-sans text-sm font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Khám phá ngay <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/products?category=ao-so-mi"
                  className="px-8 py-3.5 rounded-full bg-card hover:bg-bg-alt border border-line text-ink font-sans text-sm font-semibold transition-all shadow-xs"
                >
                  Xem Áo Sơ Mi
                </Link>
              </div>
            </div>

            {/* Right Floating Product Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Floating Badge */}
                <div className="absolute -top-4 -left-4 z-20 bg-coral text-white font-mono text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5 animate-bounce">
                  <Flame className="w-4 h-4" /> Best Seller 2026
                </div>

                <div className="bg-card border border-line rounded-3xl p-4 shadow-2xl relative">
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-bg-alt relative">
                    <img
                      src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80"
                      alt="Áo Sơ Mi Oxford Premium"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-ink text-white font-mono text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                      NEW ARRIVAL
                    </div>
                  </div>

                  <div className="mt-4 p-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-ink-soft uppercase">Áo Sơ Mi Nam</span>
                      <h3 className="font-display font-bold text-lg text-ink">Áo Sơ Mi Oxford Cotton Premium</h3>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-ink-soft line-through block">650.000đ</span>
                      <span className="font-mono text-lg font-bold text-accent">490.000đ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="font-mono text-xs text-accent font-semibold uppercase tracking-widest">
            DANH MỤC SẢN PHẨM
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink">
            Lựa Chọn Theo Phong Cách
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative bg-card border border-line rounded-2xl overflow-hidden p-3 hover:border-accent hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bg-alt relative mb-4">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-ink/10 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="flex items-center justify-between px-1 pb-1">
                <div>
                  <h3 className="font-display font-semibold text-lg text-ink group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-ink-soft font-sans">{cat.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-bg-alt group-hover:bg-accent group-hover:text-white text-ink flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="font-mono text-xs text-accent font-semibold uppercase tracking-widest block mb-1">
              SẢN PHẨM NỔI BẬT
            </span>
            <h2 className="font-display font-bold text-3xl text-ink">
              Xu Hướng Được Yêu Thích
            </h2>
          </div>
          <Link
            to="/products"
            className="font-sans text-sm font-semibold text-accent hover:text-accent-dark flex items-center gap-1.5"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-line rounded-2xl p-4 space-y-4">
                <div className="aspect-[4/5] bg-bg-alt rounded-xl" />
                <div className="h-4 bg-bg-alt rounded w-3/4" />
                <div className="h-4 bg-bg-alt rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError || products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Fallback demo cards when API has no products */}
            <ProductCard
              name="Áo Polo Nam Modern Fit"
              price={350000}
              oldPrice={450000}
              category="Áo Polo"
              slug="ao-polo-modern-fit"
            />
            <ProductCard
              name="Quần Tây Slimfit Co Giãn"
              price={520000}
              category="Quần Tây"
              slug="quan-tay-slimfit"
            />
            <ProductCard
              name="Áo Sơ Mi Trắng Form Rộng"
              price={420000}
              badge="sale"
              category="Áo Sơ Mi"
              slug="ao-so-mi-trang"
            />
            <ProductCard
              name="Áo Khoác Bomber Kaki"
              price={680000}
              badge="out"
              category="Áo Khoác"
              slug="ao-khoac-bomber-kaki"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-ink text-white overflow-hidden p-8 sm:p-12 lg:p-16 border border-line">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral/20 border border-coral/30 text-coral">
              <Tag className="w-4 h-4" />
              <span className="font-mono text-xs font-semibold uppercase">ƯU ĐÃI ĐẶC BIỆT</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Giảm ngay 20% Cho Đơn Hàng Đầu Tiên
            </h2>
            <p className="text-white/70 text-sm sm:text-base font-sans leading-relaxed">
              Nhập mã <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">MENWEAR20</span> tại bước thanh toán để nhận ngay quà tặng ưu đãi.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-accent hover:bg-accent-dark text-white font-sans text-sm font-semibold uppercase tracking-wider transition-all shadow-md"
              >
                Sắm ngay bây giờ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
