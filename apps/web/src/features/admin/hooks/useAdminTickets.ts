import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Ticket, ApiList } from '@/lib/types';

interface AdminTicketsFiltros {
  tipo?: string | null;
  estado?: string | null;
  q?: string | null;
  page?: number;
  per_page?: number;
}

export function useAdminTickets(filtros: AdminTicketsFiltros) {
  return useQuery({
    queryKey: ['admin-tickets', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.tipo) params.set('tipo', filtros.tipo);
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.q) params.set('q', filtros.q);
      if (filtros.page) params.set('page', String(filtros.page));
      if (filtros.per_page) params.set('per_page', String(filtros.per_page));

      const { data } = await api.get<ApiList<Ticket>>(`/admin/tickets?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAsignarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: number) => {
      const { data } = await api.patch(`/admin/tickets/${ticketId}/asignar`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}

export function useCambiarEstadoTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado, resolucion }: { id: number; estado: string; resolucion?: string }) => {
      const { data } = await api.patch(`/admin/tickets/${id}/estado`, { estado, resolucion });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}
