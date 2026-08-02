import { getAuthToken, getAuthHeader } from '../lib/auth-storage';

export interface WishlistItem {
  id: string;
  added_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    image_url: string | null;
    is_active: boolean;
  };
}

export const wishlistService = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    const token = getAuthToken();
    if (!token) return [];
    
    const res = await fetch('/api/wishlists', {
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw new Error('Failed to fetch wishlist');
    return res.json();
  },

  toggleWishlist: async (productId: string): Promise<{ is_wished: boolean }> => {
    const token = getAuthToken();
    if (!token) throw new Error('Chưa đăng nhập tài khoản');

    const res = await fetch(`/api/wishlists/toggle/${productId}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw new Error('Không thể cập nhật danh sách yêu thích');
    return res.json();
  },

  checkStatus: async (productId: string): Promise<{ is_wished: boolean }> => {
    const token = getAuthToken();
    if (!token) return { is_wished: false };

    const res = await fetch(`/api/wishlists/status/${productId}`, {
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!res.ok) return { is_wished: false };
    return res.json();
  }
};
