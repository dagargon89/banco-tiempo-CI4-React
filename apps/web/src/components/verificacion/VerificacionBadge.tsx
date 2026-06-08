import { CheckCircle, Clock, XCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { EstadoVerificacion } from '@/lib/types';

interface Props {
  estado: EstadoVerificacion;
}

const config: Record<EstadoVerificacion, { variant: 'success' | 'warning' | 'error' | 'neutral'; icon: typeof CheckCircle | null; label: string }> = {
  verificado: { variant: 'success', icon: CheckCircle, label: 'Verificado' },
  pendiente: { variant: 'warning', icon: Clock, label: 'Pendiente' },
  rechazado: { variant: 'error', icon: XCircle, label: 'Rechazado' },
  no_verificado: { variant: 'neutral', icon: null, label: 'No verificado' },
};

export default function VerificacionBadge({ estado }: Props) {
  const { variant, icon: Icon, label } = config[estado];

  return (
    <Badge variant={variant}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Badge>
  );
}
