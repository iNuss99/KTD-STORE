import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useWishlist, useToggleWishlistMutation } from '../../hooks/useWishlist';
import { getAuthToken } from '../../lib/auth-storage';
import { ProductImage } from '../../components/common/ProductImage';

export const WishlistPage: React.FC = () => {
  const { data: items = [], isLoading: loading } = useWishlist();
  const toggleMutation = useToggleWishlistMutation();

  const handleRemove = (productId: string) => {
    toggleMutation.mutate(productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col font-sans">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full flex items-center justify-center flex-col gap-3">
          <Loader2 className="w-8 h-8 text-stitch animate-spin" />
          <span className="font-mono text-xs text-smoke">Đang tải danh sách yêu thích...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col font-sans">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-chalk">
          <Heart className="w-6 h-6 text-stitch fill-stitch" />
          <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal">Danh Sách Yêu Thích</h1>
          <span className="font-mono text-xs text-smoke">({items.length} món)</span>
        </div>

        {!getAuthToken() ? (
          <div className="bg-canvas border border-chalk p-12 text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-12 h-12 bg-warm-white border border-chalk text-stitch rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl text-ink">Yêu cầu đăng nhập</h2>
            <p className="font-mono text-xs text-smoke">
              Vui lòng đăng nhập tài khoản để xem và quản lý danh sách sản phẩm yêu thích của bạn.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-ink hover:bg-stitch text-warm-white px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors shadow-xs"
            >
              Đăng nhập ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-canvas border border-chalk p-12 text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-12 h-12 bg-warm-white border border-chalk text-stitch rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl text-ink">Danh sách đang trống</h2>
            <p className="font-mono text-xs text-smoke">
              Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Hãy duyệt qua bộ sưu tập để lưu lại sản phẩm phù hợp.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-ink hover:bg-stitch text-warm-white px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors shadow-xs"
            >
              Khám phá sản phẩm <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="group bg-warm-white border border-chalk overflow-hidden transition-all duration-300 hover:border-steel/50 flex flex-col relative">
                <button
                  onClick={() => handleRemove(item.product.id)}
                  className="absolute top-3 right-3 p-2 bg-warm-white/90 backdrop-blur-xs border border-chalk text-smoke hover:text-rose-600 z-10 transition shadow-xs"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="relative aspect-[4/5] bg-canvas overflow-hidden">
                  <ProductImage
                    src={item.product.image_url}
                    alt={item.product.name}
                    aspectRatio="portrait"
                  />
                  {!item.product.is_active && (
                    <div className="absolute inset-0 bg-ink/60 flex items-center justify-center backdrop-blur-xs z-10">
                      <span className="font-mono text-[10px] uppercase text-warm-white bg-stitch px-3 py-1 tracking-widest">
                        Ngừng kinh doanh
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between bg-warm-white space-y-2">
                  <div>
                    <h3 className="font-sans font-medium text-sm text-ink line-clamp-1 group-hover:text-stitch transition-colors">
                      <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                    </h3>
                  </div>
                  <div className="pt-2 border-t border-chalk flex items-baseline justify-between">
                    <span className="font-mono text-xs text-smoke uppercase">Giá niêm yết</span>
                    <span className="font-mono text-sm font-semibold text-ink stitch-underline">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.product.base_price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
