import Badge from '@/components/ui/Badge';
import type { EstadoVinculacion } from '@/lib/types';

const variantMap: Record<EstadoVinculacion, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  solicitada: 'warning',
  aceptada: 'success',
  rechazada: 'error',
  completada: 'info',
  cancelada: 'neutral',
};

const labelMap: Record<EstadoVinculacion, string> = {
  solicitada: 'Solicitada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

interface EstadoBadgeProps {
  estado: EstadoVinculacion;
  className?: string;
}

export default function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  return (
    <Badge variant={variantMap[estado]} className={className}>
      {labelMap[estado]}
    </Badge>
  );
}
