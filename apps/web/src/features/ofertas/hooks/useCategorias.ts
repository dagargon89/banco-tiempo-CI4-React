import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Categoria } from '@/lib/types';

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Categoria[] }>('/categorias');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
