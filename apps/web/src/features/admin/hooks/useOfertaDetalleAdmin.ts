import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface OfertaDetalleAdmin {
  id: number;
  titulo: string;
  descripcion_breve: string;
  descripcion_completa: string | null;
  modalidad: string;
  zona: string | null;
  estado: string;
  pausada_por_admin: number;
  user_id: number;
  oferente_nombre: string;
  oferente_foto: string | null;
  oferente_inactivo: boolean;
  imagenes: { id: number; ruta: string; orden: number }[];
  vinculaciones_count: number;
}

export function useOfertaDetalleAdmin(id: number | null) {
  return useQuery({
    queryKey: ['admin-oferta', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: OfertaDetalleAdmin }>(`/admin/ofertas/${id}`);
      return data.data;
    },
    enabled: id != null,
  });
}
