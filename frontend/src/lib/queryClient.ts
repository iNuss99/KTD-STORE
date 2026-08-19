import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút cache dữ liệu
      gcTime: 1000 * 60 * 15, // Giữ cached data trong 15 phút
      refetchOnWindowFocus: false, // Tránh bão refetch khi chuyển tab/cửa sổ
      retry: 1,
    },
  },
});
