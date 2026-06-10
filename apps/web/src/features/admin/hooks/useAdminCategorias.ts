import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCrearCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data } = await api.post('/admin/categorias', { nombre });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: number; nombre: string }) => {
      const { data } = await api.patch(`/admin/categorias/${id}`, { nombre });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}

export function useToggleCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, activa }: { id: number; activa: boolean }) => {
      const { data } = await api.patch(`/admin/categorias/${id}/activa`, { activa });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}
