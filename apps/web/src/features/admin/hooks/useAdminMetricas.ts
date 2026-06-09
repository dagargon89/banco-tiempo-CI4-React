import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Metricas } from '@/lib/types';

export function useMetricas() {
  return useQuery({
    queryKey: ['admin-metricas'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Metricas }>('/admin/metricas');
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}
