import React, { useState } from 'react';
import { Star, X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAuthHeader } from '../../lib/auth-storage';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  orderItemId: string;
  productName: string;
  productImage?: string;
  variantInfo?: string;
  onReviewSubmitted?: () => void;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  orderItemId,
  productName,
  productImage,
  variantInfo,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          productId,
          orderItemId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onReviewSubmitted?.();
          onClose();
        }, 1200);
      } else {
        const err = await res.json();
        setError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '⭐ Tuyệt vời - Rất hài lòng';
      case 4:
        return '👍 Tốt - Hài lòng';
      case 3:
        return '😐 Bình thường';
      case 2:
        return '👎 Không hài lòng';
      case 1:
        return '😡 Rất tệ';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-3xl p-6 max-w-lg w-full shadow-2xl font-sans relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ink-soft hover:text-ink hover:bg-bg-alt rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-display font-bold text-ink mb-1">Đánh giá sản phẩm</h3>
        <p className="text-xs text-ink-soft mb-4">Chia sẻ trải nghiệm thực tế để giúp những người mua khác.</p>

        {/* Product preview */}
        <div className="flex items-center gap-3 p-3 bg-bg-alt rounded-2xl border border-line mb-5">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-12 h-14 object-cover rounded-xl border border-line shrink-0"
            />
          ) : (
            <div className="w-12 h-14 bg-card rounded-xl border border-line flex items-center justify-center text-xs font-mono text-ink-soft shrink-0">
              KTD
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-ink truncate">{productName}</h4>
            {variantInfo && <p className="text-[11px] font-mono text-ink-soft mt-0.5">{variantInfo}</p>}
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-ink">Gửi đánh giá thành công!</h4>
            <p className="text-xs text-ink-soft">Cảm ơn bạn đã đóng góp ý kiến cho Knot To Detail.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Star selector */}
            <div className="text-center py-2 bg-bg-alt/50 rounded-2xl border border-line">
              <span className="block text-xs font-semibold text-ink-soft mb-2">Chất lượng sản phẩm</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = hoverRating ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 stroke-[1.5]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-accent mt-2">
                {getRatingLabel(hoverRating || rating)}
              </p>
            </div>

            {/* Comment input */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Nhận xét của bạn (không bắt buộc)
              </label>
              <textarea
                rows={3}
                placeholder="Hãy chia sẻ về form dáng, chất liệu vải, độ vừa vặn hoặc cảm nhận khi mặc..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 bg-card border border-line rounded-2xl text-xs text-ink placeholder-ink-soft focus:outline-none focus:border-accent font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-line text-ink-soft hover:text-ink rounded-xl text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-ink hover:bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Hoàn tất đánh giá
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
