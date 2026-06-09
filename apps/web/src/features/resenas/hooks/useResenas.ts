import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Resena, ResenaEstadisticas } from '@/lib/types';

interface ResenasResponse {
  data: Resena[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    estadisticas: ResenaEstadisticas;
  };
}

export function useResenasDeUsuario(userId: number | undefined, page = 1, perPage = 10) {
  return useQuery({
    queryKey: ['resenas', userId, page, perPage],
    queryFn: async () => {
      const { data } = await api.get<ResenasResponse>(
        `/usuarios/${userId}/resenas?page=${page}&per_page=${perPage}`,
      );
      return data;
    },
    enabled: !!userId,
  });
}

export function useCrearResena() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vinculacionId,
      calificacion,
      comentario,
    }: {
      vinculacionId: number;
      calificacion: number;
      comentario?: string;
    }) => {
      const { data } = await api.post(`/vinculaciones/${vinculacionId}/resena`, {
        calificacion,
        comentario,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resenas'] });
      queryClient.invalidateQueries({ queryKey: ['vinculacion'] });
    },
  });
}

export function useReportarResena() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resenaId: number) => {
      const { data } = await api.post(`/resenas/${resenaId}/reportar`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resenas'] });
    },
  });
}
