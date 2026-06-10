import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUsuarioDetalle, ApiItem } from '@/lib/types';

export function useUsuarioDetalle(id: number | null) {
  return useQuery({
    queryKey: ['admin-usuario', id],
    queryFn: async () => {
      const { data } = await api.get<ApiItem<AdminUsuarioDetalle>>(`/admin/usuarios/${id}`);
      return data.data;
    },
    enabled: id != null,
  });
}
