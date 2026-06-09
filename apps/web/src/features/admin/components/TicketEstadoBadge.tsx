import Badge from '@/components/ui/Badge';
import type { EstadoTicket } from '@/lib/types';

const variantMap: Record<EstadoTicket, 'info' | 'warning' | 'success' | 'neutral'> = {
  abierto: 'info',
  en_proceso: 'warning',
  resuelto: 'success',
  cerrado: 'neutral',
};

const labelMap: Record<EstadoTicket, string> = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

export default function TicketEstadoBadge({ estado }: { estado: EstadoTicket }) {
  return <Badge variant={variantMap[estado] ?? 'neutral'}>{labelMap[estado] ?? estado}</Badge>;
}
