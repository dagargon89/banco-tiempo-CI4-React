import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OfertaDetalle, ApiList } from '@/lib/types';

interface AdminOfertasFiltros {
  estado?: string | null;
  categoria_id?: number | null;
  q?: string | null;
  page?: number;
  per_page?: number;
}

export function useAdminOfertas(filtros: AdminOfertasFiltros) {
  return useQuery({
    queryKey: ['admin-ofertas', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.categoria_id) params.set('categoria_id', String(filtros.categoria_id));
      if (filtros.q) params.set('q', filtros.q);
      if (filtros.page) params.set('page', String(filtros.page));
      if (filtros.per_page) params.set('per_page', String(filtros.per_page));

      const { data } = await api.get<ApiList<OfertaDetalle & { oferente_nombre: string; categoria_nombre: string }>>(`/admin/ofertas?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useDespublicarOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/ofertas/${id}/despublicar`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ofertas'] });
    },
  });
}
