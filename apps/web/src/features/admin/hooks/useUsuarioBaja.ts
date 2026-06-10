import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiItem } from '@/lib/types';

export function useDarBajaUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const { data } = await api.post<ApiItem<{ ofertas_pausadas: number }>>(
        `/admin/usuarios/${id}/baja`,
        { motivo },
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin-usuario', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin-ofertas'] });
    },
  });
}

export function useReactivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<ApiItem<{ ofertas_reactivadas: number }>>(
        `/admin/usuarios/${id}/reactivar`,
      );
      return data.data;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin-usuario', id] });
      qc.invalidateQueries({ queryKey: ['admin-ofertas'] });
    },
  });
}
