import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút cache dữ liệu
      gcTime: 1000 * 60 * 15, // Giữ cached data trong 15 phút
      refetchOnWindowFocus: false, // Tránh bão refetch khi chuyển tab/cửa sổ
      // Render free tier có thể mất 50-60s để wake up sau khi sleep
      // Retry 3 lần với tổng thời gian chờ ~60s
      retry: 3,
      retryDelay: (attempt) => Math.min(5000 * (attempt + 1), 20000), // 5s → 10s → 20s
    },
  },
});
