import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { VinculacionCard, ApiList, ApiItem } from '@/lib/types';

interface VinculacionFiltros {
  estado?: string | null;
  rol?: string | null;
  page?: number;
  per_page?: number;
}

export function useListarVinculaciones(filtros: VinculacionFiltros) {
  return useQuery({
    queryKey: ['vinculaciones', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.rol) params.set('rol', filtros.rol);
      if (filtros.page) params.set('page', String(filtros.page));
      if (filtros.per_page) params.set('per_page', String(filtros.per_page));

      const { data } = await api.get<ApiList<VinculacionCard>>(`/vinculaciones?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useVinculacionDetalle(id: number | string) {
  return useQuery({
    queryKey: ['vinculacion', id],
    queryFn: async () => {
      const { data } = await api.get<ApiItem<VinculacionCard>>(`/vinculaciones/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useMarcarInteres() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ofertaId: number) => {
      const { data } = await api.post<ApiItem<VinculacionCard>>(`/ofertas/${ofertaId}/interes`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculaciones'] });
    },
  });
}

export function useAceptarVinculacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<ApiItem<VinculacionCard>>(`/vinculaciones/${id}/aceptar`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculaciones'] });
      queryClient.invalidateQueries({ queryKey: ['vinculacion'] });
    },
  });
}

export function useRechazarVinculacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<ApiItem<VinculacionCard>>(`/vinculaciones/${id}/rechazar`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculaciones'] });
      queryClient.invalidateQueries({ queryKey: ['vinculacion'] });
    },
  });
}

export function useCancelarVinculacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<ApiItem<VinculacionCard>>(`/vinculaciones/${id}/cancelar`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculaciones'] });
      queryClient.invalidateQueries({ queryKey: ['vinculacion'] });
    },
  });
}

export function useConfirmarVinculacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<ApiItem<VinculacionCard>>(`/vinculaciones/${id}/confirmar`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vinculaciones'] });
      queryClient.invalidateQueries({ queryKey: ['vinculacion'] });
    },
  });
}
