import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface TicketDetalleAdmin {
  id: number;
  folio: string;
  tipo: string;
  estado: string;
  entidad_tipo: string;
  entidad_id: number | null;
  descripcion: string;
  resolucion: string | null;
  creador_id: number;
  creador_nombre: string | null;
  creador_foto: string | null;
  creador_inactivo: boolean;
  asignado_a: number | null;
  asignado_a_nombre: string | null;
  created_at: string;
  updated_at: string;
  historial: { actor_id: number; accion: string; metadata: string | null; created_at: string }[];
}

export function useTicketDetalleAdmin(id: number | null) {
  return useQuery({
    queryKey: ['admin-ticket', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: TicketDetalleAdmin }>(`/admin/tickets/${id}`);
      return data.data;
    },
    enabled: id != null,
  });
}
