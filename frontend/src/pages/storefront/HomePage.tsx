import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../../components/storefront/ProductCard';
import { ProductImage } from '../../components/common/ProductImage';
import { ArrowRight, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatVND = (amount: number) => vndFormatter.format(amount);

export const HomePage: React.FC = () => {
  const { data: productsData, isLoading, isError } = useProducts({ limit: 8 });
  const products = productsData?.data || [];

  const fallbackFeatured = [
    {
      id: 'featured-oxford',
      name: 'Áo Sơ Mi Oxford Tailored',
      category: 'HERITAGE EDITION',
      price: 890000,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      link: '/products',
    },
    {
      id: 'featured-polo',
      name: 'Áo Polo KTDL Supima Cotton',
      category: 'SIGNATURE PIQUE',
      price: 650000,
      image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80',
      link: '/products',
    },
    {
      id: 'featured-linen',
      name: 'Áo Sơ Mi Pure French Linen',
      category: 'SUMMER KTDL',
      price: 950000,
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      link: '/products',
    },
    {
      id: 'featured-tshirt',
      name: 'Áo T-Shirt Heavyweight Cotton',
      category: 'ESSENTIALS 2026',
      price: 490000,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      link: '/products',
    },
    {
      id: 'featured-blazer',
      name: 'Áo Khoác Deconstructed Blazer',
      category: 'TAILORED COLLECTION',
      price: 1450000,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      link: '/products',
    },
  ];

  // Map API products if available (up to 5 items), otherwise fallback to curated items
  const slideItems = products.length >= 3
    ? products.slice(0, 5).map((p) => {
        const firstImg = p.images?.[0];
        const imgUrl = typeof firstImg === 'string'
          ? firstImg
          : (firstImg as any)?.url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80';
        return {
          id: p.id,
          name: p.name,
          category: p.category?.name || 'KTDL SPECIAL',
          price: Number(p.base_price) || 0,
          image: imgUrl,
          link: `/products/${p.id}`,
        };
      })
    : fallbackFeatured;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || slideItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused, slideItems.length]);

  const currentItem = slideItems[currentSlide] || slideItems[0];

  const categories = [
    {
      id: 'ao-so-mi',
      name: 'Áo Sơ Mi KTDL',
      tag: 'Tailored Oxford',
      itemCount: '24+ Thiết kế',
      desc: 'Phom dáng may đo chuẩn xác, chất vải Oxford dệt vân cao cấp',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=85',
    },
    {
      id: 'ao-polo',
      name: 'Áo Polo Cotton',
      tag: 'Pima Cotton 3D',
      itemCount: '18+ Thiết kế',
      desc: 'Sợi bông chải kỹ siêu mịn, cổ dệt 3D giữ phom sắc nét',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900&auto=format&fit=crop&q=85',
    },
    {
      id: 'ao-thun',
      name: 'Áo Thun',
      tag: 'Heavyweight Fit',
      itemCount: '32+ Thiết kế',
      desc: 'Định lượng 260gsm dày dặn, thoáng khí tự nhiên vượt trội',
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&auto=format&fit=crop&q=85',
    },
    {
      id: 'ao-khoac',
      name: 'Áo Khoác Heritage',
      tag: 'Signature Outerwear',
      itemCount: '12+ Thiết kế',
      desc: 'Chất liệu trượt nước công nghệ cao, lót lụa mềm mại',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=85',
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
      <section className="relative min-h-[72vh] flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-6 sm:space-y-7 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#C8A96E]/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C8A96E]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C8A96E]">
                ESSENTIAL SHIRTS &amp; TOPS — ISSUE N°24
              </span>
            </div>

            <h1 className="font-editorial font-bold text-4xl sm:text-6xl lg:text-7xl text-[#C8A96E] leading-[1.15] sm:leading-[1.1] tracking-tight">
              <span className="italic font-serif block">
                Tối Giản <br />
                Tinh Tế <br />
                Sang Trọng
              </span>
            </h1>

            <p className="text-[#6E6E6E] text-base sm:text-lg max-w-xl font-sans leading-relaxed">
              KTDL — Studio chuyên các dòng áo nam cao cấp. Cắt may tỉ mỉ, chất liệu tự nhiên chuẩn phom, nâng tầm phong cách lịch lãm hàng ngày.
            </p>

            <div className="pt-2 sm:pt-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 px-9 py-4 bg-[#1A1A1A] hover:bg-[#C8A96E] text-white font-mono text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-md group"
              >
                KHÁM PHÁ BỘ SƯU TẬP
                <ArrowRight className="w-4 h-4 text-[#C8A96E] group-hover:text-white transition-colors" />
              </Link>
            </div>
          </motion.div>

          {/* Right Editorial Presentation Card (Auto-Pop Slide 3s) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <Link
              to={currentItem.link}
              className="group block relative w-full aspect-[3/4] bg-[#EFECE6] border border-[#1A1A1A]/10 p-3 shadow-2xl overflow-hidden cursor-pointer"
              title={`Xem chi tiết: ${currentItem.name}`}
            >
              {/* Slide Indicators Dots */}
              <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-[#1A1A1A]/50 backdrop-blur-xs px-2.5 py-1.5 rounded-full">
                {slideItems.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? 'w-4 bg-[#C8A96E]' : 'w-1.5 bg-white/60 hover:bg-white'
                    }`}
                    aria-label={`Chuyển tới sản phẩm ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Animated Product Pop Frame */}
              <div className="w-full h-full relative overflow-hidden bg-[#EFECE6]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.04, filter: 'blur(2px)' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full h-full relative"
                  >
                    <ProductImage
                      src={currentItem.image}
                      alt={currentItem.name}
                      category={currentItem.category}
                      aspectRatio="portrait"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Card Caption */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 border border-[#1A1A1A]/10 flex items-center justify-between shadow-md transition-transform duration-300 group-hover:-translate-y-1">
                <div className="space-y-0.5 max-w-[68%]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#C8A96E] font-semibold">
                      {currentItem.category}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#1A1A1A] text-[#F5F2EE] font-mono rounded-xs font-semibold">
                      {currentSlide + 1}/{slideItems.length}
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#1A1A1A] truncate">
                    {currentItem.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm sm:text-base font-bold text-[#1A1A1A] block">
                    {formatVND(currentItem.price)}
                  </span>
                  <span className="text-[10px] text-[#C8A96E] font-mono font-medium flex items-center justify-end gap-1 group-hover:underline">
                    Xem áo <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Category Grid Section - Editorial Lookbook Overlay */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C8A96E]/10 border border-[#C8A96E]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-pulse" />
            <h2 className="font-mono text-[11px] text-[#A68238] font-bold uppercase tracking-[0.25em]">
              DANH MỤC TUYỂN CHỌN
            </h2>
          </div>
          <h3 className="font-editorial font-bold text-3xl sm:text-5xl text-[#1A1A1A] tracking-tight leading-tight">
            Lựa Chọn Theo Dáng Áo
          </h3>
          <p className="text-xs sm:text-sm text-[#6E6E6E] font-sans max-w-lg mx-auto leading-relaxed">
            Được nghiên cứu phom dáng chuẩn mực theo tỉ lệ cơ thể nam giới, tôn vinh khí chất lịch lãm trong từng chuyển động.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative overflow-hidden rounded-2xl bg-[#141414] aspect-[3/4] sm:aspect-[4/5] shadow-md hover:shadow-2xl transition-all duration-700 flex flex-col justify-between border border-[#1A1A1A]/10 hover:border-[#C8A96E]/80"
            >
              {/* Background Image with Smooth Zoom */}
              <div className="absolute inset-0 overflow-hidden bg-[#1A1A1A]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:brightness-105"
                />
              </div>

              {/* Multi-layered Vignette & Editorial Gradients */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

              {/* Subtle ambient border glow on hover */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-[#C8A96E]/50 pointer-events-none transition-all duration-500" />

              {/* Floating Header Badges */}
              <div className="relative z-10 p-5 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[11px] font-mono font-medium text-white/90 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E]" />
                  {cat.itemCount}
                </span>

                <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center group-hover:bg-[#C8A96E] group-hover:text-[#1A1A1A] group-hover:scale-110 group-hover:border-[#C8A96E] shadow-sm transition-all duration-300">
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Bottom Content Overlay */}
              <div className="relative z-10 p-5 pt-0 space-y-1.5">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#C8A96E] uppercase font-bold block">
                  {cat.tag}
                </span>

                <h4 className="font-editorial font-bold text-2xl sm:text-[26px] text-white tracking-tight leading-snug group-hover:text-[#F3E5AB] transition-colors">
                  {cat.name}
                </h4>

                <p className="text-xs text-white/80 font-sans line-clamp-2 leading-relaxed font-normal">
                  {cat.desc}
                </p>

                {/* Hover CTA Bar */}
                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-white/90 group-hover:text-[#C8A96E] transition-colors">
                  <span className="font-mono text-[11px] tracking-wider uppercase">Xem bộ sưu tập</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div>
            <h2 className="font-mono text-xs text-[#C8A96E] font-semibold uppercase tracking-[0.25em] block mb-1">
              SẢN PHẨM MỚI NHẤT
            </h2>
            <h3 className="font-editorial font-bold text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight">
              Bản Phối Mới Cho Mùa Này
            </h3>
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
              images={['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80']}
            />
            <ProductCard
              name="Áo T-Shirt Heavyweight Oversize"
              price={380000}
              category="Áo T-Shirt"
              slug="ao-tshirt-heavyweight"
              images={['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80']}
            />
            <ProductCard
              name="Áo Sơ Mi Linen Tự Nhiên"
              price={550000}
              badge="sale"
              category="Áo Sơ Mi"
              slug="ao-so-mi-linen"
              images={['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80']}
            />
            <ProductCard
              name="Áo Khoác Blazer Tailored Classic"
              price={1250000}
              badge="out"
              category="Áo Khoác"
              slug="ao-khoac-blazer-classic"
              images={['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80']}
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
              100% sợi tự nhiên Cotton Supima, Wool Blend &amp; Linen Pháp thoáng khí, bền đẹp theo thời gian.
            </p>
          </div>

          <div className="space-y-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-full bg-[#F5F2EE] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] mx-auto md:mx-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[#1A1A1A]">Bảo Hành &amp; Đổi Trả</h3>
            <p className="text-xs text-[#6E6E6E] font-sans leading-relaxed">
              Hỗ trợ 30 ngày đổi hàng miễn phí tận nhà. Cam kết 100% đúng hình ảnh &amp; chất lượng công bố.
            </p>
          </div>

          <div className="space-y-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-full bg-[#F5F2EE] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] mx-auto md:mx-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[#1A1A1A]">Giao Hàng Hỏa Tốc</h3>
            <p className="text-xs text-[#6E6E6E] font-sans leading-relaxed">
              Đóng gói hộp quà KTDL sang trọng. Giao hàng toàn quốc từ 1-3 ngày làm việc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
