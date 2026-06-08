import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { VerificacionPendiente } from '@/lib/types';

export function useVerificacionesPendientes() {
  return useQuery({
    queryKey: ['admin', 'verificaciones'],
    queryFn: async () => {
      const { data } = await api.get<{ data: VerificacionPendiente[] }>('/admin/verificaciones');
      return data.data;
    },
  });
}

export function useDocumentoUrl(id: number) {
  return useQuery({
    queryKey: ['admin', 'verificaciones', id, 'documento'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { url: string; expires_in: number } }>(
        `/admin/verificaciones/${id}/documento`,
      );
      return data.data;
    },
    enabled: false, // Solo se ejecuta manualmente con refetch
  });
}

export function useResolverVerificacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: number; accion: 'aprobar' | 'rechazar'; motivo?: string }) => {
      const { data } = await api.patch(`/admin/verificaciones/${params.userId}`, {
        accion: params.accion,
        motivo: params.motivo,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verificaciones'] });
    },
  });
}
