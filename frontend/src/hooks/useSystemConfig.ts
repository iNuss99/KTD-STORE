import { useQuery } from '@tanstack/react-query';

export interface SystemConfigItem {
  key: string;
  value: string;
  description?: string;
}

export function useSystemConfigs() {
  return useQuery<SystemConfigItem[]>({
    queryKey: ['system-configs'],
    queryFn: async () => {
      const res = await fetch('/api/system-configs');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10_000,
  });
}

export function useMaintenanceMode() {
  const { data: configs = [], isLoading } = useSystemConfigs();
  const maintenanceItem = configs.find((c) => c.key === 'MAINTENANCE_MODE');
  const isMaintenance = maintenanceItem?.value === 'true';
  return { isMaintenance, isLoading };
}
