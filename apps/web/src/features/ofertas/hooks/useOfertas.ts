import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OfertaCard, OfertaDetalle, OfertaFormData, ApiList, ApiItem } from '@/lib/types';

interface ExplorarFiltros {
  categoria_id?: number | null;
  modalidad?: string | null;
  zona?: string | null;
  q?: string | null;
  page?: number;
  per_page?: number;
}

export function useExplorarOfertas(filtros: ExplorarFiltros) {
  return useQuery({
    queryKey: ['ofertas', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.categoria_id) params.set('categoria_id', String(filtros.categoria_id));
      if (filtros.modalidad) params.set('modalidad', filtros.modalidad);
      if (filtros.zona) params.set('zona', filtros.zona);
      if (filtros.q) params.set('q', filtros.q);
      if (filtros.page) params.set('page', String(filtros.page));
      if (filtros.per_page) params.set('per_page', String(filtros.per_page));

      const { data } = await api.get<ApiList<OfertaCard>>(`/ofertas?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useOfertaDetalle(id: number | string) {
  return useQuery({
    queryKey: ['oferta', id],
    queryFn: async () => {
      const { data } = await api.get<ApiItem<OfertaDetalle>>(`/ofertas/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCrearOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: OfertaFormData) => {
      const { data } = await api.post<ApiItem<OfertaDetalle>>('/ofertas', datos);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      queryClient.invalidateQueries({ queryKey: ['mis-ofertas'] });
    },
  });
}

export function useActualizarOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: Partial<OfertaFormData> }) => {
      const { data } = await api.patch<ApiItem<OfertaDetalle>>(`/ofertas/${id}`, datos);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      queryClient.invalidateQueries({ queryKey: ['mis-ofertas'] });
      queryClient.setQueryData(['oferta', data.id], data);
    },
  });
}

export function useCambiarEstadoOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const { data } = await api.patch<ApiItem<OfertaDetalle>>(`/ofertas/${id}/estado`, { estado });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      queryClient.invalidateQueries({ queryKey: ['mis-ofertas'] });
    },
  });
}

export function useMisOfertas() {
  return useQuery({
    queryKey: ['mis-ofertas'],
    queryFn: async () => {
      const { data } = await api.get<{ data: OfertaDetalle[] }>('/me/ofertas');
      return data.data;
    },
  });
}
