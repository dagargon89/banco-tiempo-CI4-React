import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import EstadoBadge from './EstadoBadge';
import { useAceptarVinculacion, useRechazarVinculacion } from '../hooks/useVinculaciones';
import type { VinculacionCard as VinculacionCardType } from '@/lib/types';

interface VinculacionCardProps {
  vinculacion: VinculacionCardType;
  userId: number;
}

export default function VinculacionCard({ vinculacion, userId }: VinculacionCardProps) {
  const esOferente = userId === Number(vinculacion.oferente_id);
  const contraparte = esOferente
    ? { nombre: vinculacion.buscador_nombre, foto: vinculacion.buscador_foto, rol: 'Buscador' }
    : { nombre: vinculacion.oferente_nombre, foto: vinculacion.oferente_foto, rol: 'Oferente' };

  const aceptar = useAceptarVinculacion();
  const rechazar = useRechazarVinculacion();
  const showQuickActions = esOferente && vinculacion.estado === 'solicitada';
  const isPending = aceptar.isPending || rechazar.isPending;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30">
      <Link to={`/vinculaciones/${vinculacion.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-1">{vinculacion.oferta_titulo}</p>
            <p className="mt-0.5 text-xs text-text-3">
              {esOferente ? 'Eres el oferente' : 'Eres el buscador'}
            </p>
          </div>
          <EstadoBadge estado={vinculacion.estado} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm text-text-1">{contraparte.nombre}</p>
            <p className="text-xs text-text-3">{contraparte.rol}</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 flex items-center gap-1">
          {(['solicitada', 'aceptada', 'completada'] as const).map((step, i) => {
            const estados = ['solicitada', 'aceptada', 'completada'];
            const currentIdx = estados.indexOf(vinculacion.estado);
            const isRejected = vinculacion.estado === 'rechazada' || vinculacion.estado === 'cancelada';
            const isActive = !isRejected && currentIdx >= i;
            const color = isRejected ? 'bg-border' : isActive ? 'bg-accent' : 'bg-border';
            return (
              <div key={step} className="flex flex-1 items-center gap-1">
                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
                {i < 2 && <div className={`h-0.5 flex-1 rounded-full ${color}`} />}
              </div>
            );
          })}
        </div>

        <p className="mt-1.5 text-xs text-text-3">
          {new Date(vinculacion.created_at).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </Link>

      {/* Quick actions for pending requests */}
      {showQuickActions && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <Button
            variant="primary"
            onClick={() => aceptar.mutate(vinculacion.id)}
            disabled={isPending}
          >
            {aceptar.isPending ? '...' : 'Aceptar'}
          </Button>
          <Button
            variant="danger"
            onClick={() => rechazar.mutate(vinculacion.id)}
            disabled={isPending}
          >
            Rechazar
          </Button>
        </div>
      )}
    </div>
  );
}
