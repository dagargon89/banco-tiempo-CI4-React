import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

export function useProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AuthUser }>('/me');
      return data.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fields: Partial<Pick<AuthUser, 'nombre' | 'bio' | 'zona' | 'foto_perfil'>>) => {
      const { data } = await api.patch<{ data: AuthUser }>('/me', fields);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('foto', file);
      const { data } = await api.post<{ data: AuthUser }>('/me/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useVerificacionEstado() {
  return useQuery({
    queryKey: ['verificacion-estado'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { estado: string; motivo_rechazo: string | null } }>('/verificacion/estado');
      return data.data;
    },
  });
}
