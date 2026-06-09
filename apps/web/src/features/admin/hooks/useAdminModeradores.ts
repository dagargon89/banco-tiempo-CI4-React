import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Moderador {
  id: number;
  nombre: string;
  email: string;
  foto_perfil: string | null;
  asignado_at: string;
}

export function useModeradores() {
  return useQuery({
    queryKey: ['admin-moderadores'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Moderador[] }>('/admin/moderadores');
      return data.data;
    },
  });
}

export function useCrearModerador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.post('/admin/moderadores', { user_id: userId });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderadores'] });
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
  });
}

export function useEliminarModerador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.delete(`/admin/moderadores/${userId}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderadores'] });
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
  });
}
