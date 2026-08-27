import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../../components/storefront/ProductCard';
import { ProductImage } from '../../components/common/ProductImage';
import { ArrowRight, Sparkles, ShieldCheck, Flame, Compass, RefreshCw } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { data: productsData, isLoading, isError } = useProducts({ limit: 8 });
  const products = productsData?.data || [];

  const categories = [
    {
      id: 'ao-so-mi',
      name: 'Áo Sơ Mi Atelier',
      desc: 'Phom dáng tailoring, chất liệu oxford/linen',
    },
    {
      id: 'ao-polo',
      name: 'Áo Polo Cotton',
      desc: 'Sợi bông chải kỹ, cổ dệt 3D tối giản',
    },
    {
      id: 'ao-tshirt',
      name: 'Áo T-Shirt Premium',
      desc: 'Cotton định lượng cao, thoáng mát chuẩn phom',
    },
    {
      id: 'ao-khoac',
      name: 'Áo Khoác Heritage',
      desc: 'Chất liệu trượt nước, lót lụa cao cấp',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-28 pb-20 font-sans overflow-hidden bg-[#F5F2EE]">
      {/* Editorial Marquee Ticker */}
      <div className="bg-[#1A1A1A] text-[#F5F2EE] py-2.5 overflow-hidden whitespace-nowrap border-b border-[#C8A96E]/30">
        <div
          className="inline-flex items-center space-x-12 font-mono text-[10px] uppercase tracking-[0.25em]"
          style={{ animation: 'marquee 30s linear infinite' }}
        >
          <span>✦ SHIRTS &amp; TOPS 2026 COLLECTION</span>
          <span>✦ FREE EXPRESS SHIPPING ORDERS OVER 1.500.000₫</span>
          <span>✦ CRAFTED WITH PRECISION &amp; SUSTAINABLE LINEN</span>
          <span>✦ 30-DAY HASSLE-FREE RETURNS</span>
          {/* Duplicate for seamless loop */}
          <span>✦ SHIRTS &amp; TOPS 2026 COLLECTION</span>
          <span>✦ FREE EXPRESS SHIPPING ORDERS OVER 1.500.000₫</span>
          <span>✦ CRAFTED WITH PRECISION &amp; SUSTAINABLE LINEN</span>
          <span>✦ 30-DAY HASSLE-FREE RETURNS</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#C8A96E]/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C8A96E]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C8A96E]">
                ESSENTIAL SHIRTS & TOPS — ISSUE N°24
              </span>
            </div>

            <h1 className="font-editorial font-normal text-4xl sm:text-6xl lg:text-7xl text-[#1A1A1A] leading-[1.05] tracking-tight">
              Tối Giản Thượng Thượng, <br />
              <span className="italic font-serif text-[#C8A96E]">
                Tinh Tế Trong Từng Dáng Áo
              </span>
            </h1>

            <p className="text-[#6E6E6E] text-base sm:text-lg max-w-xl font-sans leading-relaxed">
              KTD Atelier — Studio chuyên các dòng áo nam cao cấp. Cắt may tỉ mỉ, chất liệu tự nhiên chuẩn phom, nâng tầm phong cách lịch lãm hàng ngày.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                className="px-8 py-4 bg-[#1A1A1A] hover:bg-[#C8A96E] text-white font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-md flex items-center gap-3 group"
              >
                KHÁM PHÁ BỘ SƯU TẬP
                <ArrowRight className="w-4 h-4 text-[#C8A96E] group-hover:text-white transition-colors" />
              </Link>
              <Link
                to="/products?category=ao-so-mi"
                className="px-8 py-4 bg-white hover:bg-[#EFECE6] border border-[#1A1A1A]/20 text-[#1A1A1A] font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300"
              >
                ÁO SƠ MI ATELIER
              </Link>
            </div>
          </motion.div>

          {/* Right Editorial Presentation Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative w-full aspect-[3/4] bg-[#EFECE6] border border-[#1A1A1A]/10 p-3 shadow-2xl">
              <ProductImage
                src={null}
                alt="Áo Sơ Mi Oxford Silk Cotton"
                category="HERITAGE EDITION"
                aspectRatio="portrait"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 border border-[#1A1A1A]/10 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#C8A96E]">
                    FEATURED ITEM
                  </span>
                  <h3 className="font-editorial text-xl font-bold text-[#1A1A1A]">
                    Áo Sơ Mi Oxford Tailored
                  </h3>
                </div>
                <span className="font-mono text-sm font-bold text-[#1A1A1A]">
                  890.000₫
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="font-mono text-xs text-[#C8A96E] font-semibold uppercase tracking-[0.25em]">
            DANH MỤC TUYỂN CHỌN
          </span>
          <h2 className="font-editorial font-normal text-3xl sm:text-5xl text-[#1A1A1A]">
            Lựa Chọn Theo Dáng Áo
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative bg-white border border-[#1A1A1A]/10 p-4 hover:border-[#C8A96E] transition-all duration-500 flex flex-col justify-between"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#EFECE6] mb-4 relative">
                <ProductImage
                  src={null}
                  alt={cat.name}
                  category={cat.name}
                  aspectRatio="portrait"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-editorial font-medium text-xl text-[#1A1A1A] group-hover:text-[#C8A96E] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#6E6E6E] font-sans mt-0.5">{cat.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 group-hover:border-[#C8A96E] group-hover:bg-[#C8A96E] group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div>
            <span className="font-mono text-xs text-[#C8A96E] font-semibold uppercase tracking-[0.25em] block mb-1">
              SẢN PHẨM MỚI NHẤT
            </span>
            <h2 className="font-editorial font-normal text-3xl sm:text-4xl text-[#1A1A1A]">
              Bản Phối Mới Cho Mùa Này
            </h2>
          </div>
          <Link
            to="/products"
            className="font-mono text-xs uppercase tracking-[0.2em] text-[#1A1A1A] hover:text-[#C8A96E] flex items-center gap-2 pb-1 border-b border-[#1A1A1A]"
          >
            XEM TẤT CẢ SẢN PHẨM <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-[#1A1A1A]/10 p-4 space-y-4">
                <div className="aspect-[3/4] bg-[#EFECE6]" />
                <div className="h-4 bg-[#EFECE6] w-3/4" />
                <div className="h-4 bg-[#EFECE6] w-1/2" />
              </div>
            ))}
          </div>
        ) : isError || products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ProductCard
              name="Áo Polo Cotton Supima"
              price={450000}
              oldPrice={590000}
              category="Áo Polo"
              slug="ao-polo-supima"
            />
            <ProductCard
              name="Áo T-Shirt Heavyweight Oversize"
              price={380000}
              category="Áo T-Shirt"
              slug="ao-tshirt-heavyweight"
            />
            <ProductCard
              name="Áo Sơ Mi Linen Tự Nhiên"
              price={550000}
              badge="sale"
              category="Áo Sơ Mi"
              slug="ao-so-mi-linen"
            />
            <ProductCard
              name="Áo Khoác Blazer Tailored Classic"
              price={1250000}
              badge="out"
              category="Áo Khoác"
              slug="ao-khoac-blazer-classic"
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

      {/* Brand Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white border border-[#1A1A1A]/10 p-8 sm:p-12">
          <div className="space-y-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-full bg-[#F5F2EE] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] mx-auto md:mx-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[#1A1A1A]">Chất Liệu Tuyển Chọn</h3>
            <p className="text-xs text-[#6E6E6E] font-sans leading-relaxed">
              100% sợi tự nhiên Cotton Supima, Wool Blend & Linen Pháp thoáng khí, bền đẹp theo thời gian.
            </p>
          </div>

          <div className="space-y-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-full bg-[#F5F2EE] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] mx-auto md:mx-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[#1A1A1A]">Bảo Hành & Đổi Trả</h3>
            <p className="text-xs text-[#6E6E6E] font-sans leading-relaxed">
              Hỗ trợ 30 ngày đổi hàng miễn phí tận nhà. Cam kết 100% đúng hình ảnh & chất lượng công bố.
            </p>
          </div>

          <div className="space-y-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-full bg-[#F5F2EE] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] mx-auto md:mx-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[#1A1A1A]">Giao Hàng Hỏa Tốc</h3>
            <p className="text-xs text-[#6E6E6E] font-sans leading-relaxed">
              Đóng gói hộp quà atelier sang trọng. Giao hàng toàn quốc từ 1-3 ngày làm việc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};


