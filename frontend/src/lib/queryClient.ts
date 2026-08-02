import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút cache dữ liệu tĩnh
      gcTime: 1000 * 60 * 10, // Keep unused data for 10 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
