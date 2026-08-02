import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService, WishlistItem } from '../services/wishlist.service';
import { getAuthToken } from '../lib/auth-storage';

export function useWishlist() {
  const token = getAuthToken();

  return useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!token) return [];
      return wishlistService.getWishlist();
    },
    enabled: !!token,
  });
}

export function useToggleWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      return wishlistService.toggleWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
