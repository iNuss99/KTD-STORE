import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút cache dữ liệu
      gcTime: 1000 * 60 * 15, // Giữ cached data trong 15 phút
      refetchOnWindowFocus: false, // Tránh bão refetch khi chuyển tab/cửa sổ
      retry: 1, // Retry 1 lần nhẹ nhàng tránh nghẽn UI/lag khi có lỗi mạng
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000), // 1s → 2s (tối đa 3s)
    },
  },
});
