import { Link } from 'react-router-dom';
import { ShieldAlert, Clock, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { EstadoVerificacion } from '@/lib/types';

interface Props {
  estado: EstadoVerificacion;
  motivoRechazo?: string | null;
}

export default function VerificacionBanner({ estado, motivoRechazo }: Props) {
  if (estado === 'verificado') return null;

  if (estado === 'pendiente') {
    return (
      <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning/5 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-text-1">Tu documentación está siendo revisada</p>
          <p className="mt-1 text-xs text-text-2">
            Un moderador revisará tu identidad pronto. Te notificaremos cuando haya una resolución.
          </p>
        </div>
      </div>
    );
  }

  if (estado === 'rechazado') {
    return (
      <div className="flex items-start gap-3 rounded-md border border-error/20 bg-error/5 p-4">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text-1">Tu verificación fue rechazada</p>
          {motivoRechazo && (
            <p className="mt-1 text-xs text-text-2">Motivo: {motivoRechazo}</p>
          )}
          <p className="mt-1 text-xs text-text-2">Puedes intentar de nuevo subiendo un nuevo documento.</p>
          <Link to="/verificacion" className="mt-3 inline-block">
            <Button variant="primary">Subir documento</Button>
          </Link>
        </div>
      </div>
    );
  }

  // no_verificado
  return (
    <div className="flex items-start gap-3 rounded-md border border-accent/20 bg-accent-soft p-4">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <div className="flex-1">
        <p className="text-sm font-medium text-text-1">Completa tu verificación de identidad</p>
        <p className="mt-1 text-xs text-text-2">
          Para acceder al marketplace necesitas subir un documento de identidad. Este proceso es rápido y seguro.
        </p>
        <Link to="/verificacion" className="mt-3 inline-block">
          <Button variant="primary">Verificar identidad</Button>
        </Link>
      </div>
    </div>
  );
}
