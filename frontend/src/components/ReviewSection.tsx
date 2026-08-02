import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Check } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
  };
}

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [eligibleOrderItemId, setEligibleOrderItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = localStorage.getItem('access_token');

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:3000/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
        setTotalReviews(data.totalReviews || 0);
        setRatingCounts(data.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkEligibility = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const orders = await res.json();
        // Find delivered order containing this product
        for (const order of orders) {
          if (order.status === 'DELIVERED' && order.items) {
            for (const item of order.items) {
              if (item.variant && item.variant.product_id === productId) {
                setEligibleOrderItemId(item.id);
                return;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibleOrderItemId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:3000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          orderItemId: eligibleOrderItemId,
          rating: ratingInput,
          comment: commentInput,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Cảm ơn bạn đã gửi đánh giá!' });
        setCommentInput('');
        fetchReviews();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Không thể gửi đánh giá' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối server' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-indigo-600" />
        Đánh giá & Nhận xét sản phẩm
      </h2>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-xl mb-8">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0">
          <div className="text-4xl font-extrabold text-slate-800">{avgRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-amber-400' : 'text-slate-300'}`}
              />
            ))}
          </div>
          <div className="text-sm text-slate-500">{totalReviews} lượt đánh giá</div>
        </div>

        {/* Rating Progress Bars */}
        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-8 font-medium text-slate-600 flex items-center gap-1">
                  {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Write Form */}
      {eligibleOrderItemId && (
        <form onSubmit={handleSubmit} className="mb-10 p-6 bg-indigo-50/60 rounded-xl border border-indigo-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            Bạn đã mua sản phẩm này — Viết nhận xét
          </h3>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm mb-4 ${
                message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Đánh giá của bạn:</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRatingInput(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingInput ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nhận xét chi tiết:</label>
            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Chia sẻ nhận xét về kiểu dáng, chất liệu, size quần áo..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Chưa có đánh giá nào cho sản phẩm này.</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-b border-slate-100 pb-5 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-800 text-sm">{r.user?.fullName || 'Khách hàng'}</div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-400 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= r.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
