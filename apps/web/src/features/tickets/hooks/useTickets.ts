import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Ticket, ApiList } from '@/lib/types';

export function useCrearTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: { tipo: string; entidad_tipo?: string; entidad_id?: number; descripcion: string }) => {
      const { data } = await api.post<{ data: Ticket }>('/tickets', datos);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-tickets'] });
    },
  });
}

export function useMisTickets(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['mis-tickets', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(perPage));
      const { data } = await api.get<ApiList<Ticket>>(`/tickets/mios?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
