import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUsuario, ApiList } from '@/lib/types';

interface AdminUsuariosFiltros {
  estado_verificacion?: string | null;
  estado_cuenta?: string | null;
  q?: string | null;
  page?: number;
  per_page?: number;
  incluir_bajas?: number;
}

export function useAdminUsuarios(filtros: AdminUsuariosFiltros) {
  return useQuery({
    queryKey: ['admin-usuarios', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.estado_verificacion) params.set('estado_verificacion', filtros.estado_verificacion);
      if (filtros.estado_cuenta) params.set('estado_cuenta', filtros.estado_cuenta);
      if (filtros.q) params.set('q', filtros.q);
      if (filtros.page) params.set('page', String(filtros.page));
      if (filtros.per_page) params.set('per_page', String(filtros.per_page));
      if (filtros.incluir_bajas) params.set('incluir_bajas', String(filtros.incluir_bajas));

      const { data } = await api.get<ApiList<AdminUsuario>>(`/admin/usuarios?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado_cuenta }: { id: number; estado_cuenta: string }) => {
      const { data } = await api.patch(`/admin/usuarios/${id}/estado`, { estado_cuenta });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
  });
}
