import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import UserName from '@/components/ui/UserName';
import { toast, toastError } from '@/lib/toast';
import {
  contraparte, etiquetaEstado, faltaMiConfirmacion, fechaCorta, tonoEstado, type Papel, type Tono,
} from '@/lib/intercambio';
import { useAceptarVinculacion, useRechazarVinculacion } from '../hooks/useVinculaciones';
import type { VinculacionCard } from '@/lib/types';

const TONO: Record<Tono, string> = {
  accion: 'bg-accent text-on-accent',
  activo: 'bg-accent-soft text-accent',
  neutro: 'bg-surface-2 text-text-2',
  cerrado: 'bg-surface-2 text-text-3',
};

interface Props {
  vinculacion: VinculacionCard;
  papel: Papel;
}

/**
 * Un intercambio visto desde un papel: con quién, qué oferta y en qué va.
 * Si tienes que hacer algo, la tarjeta lo dice y trae el botón.
 */
export default function IntercambioCard({ vinculacion: v, papel }: Props) {
  const otro = contraparte(v, papel);
  const aceptar = useAceptarVinculacion();
  const rechazar = useRechazarVinculacion();
  const responder = papel === 'ensenando' && v.estado === 'solicitada';
  const confirmar = faltaMiConfirmacion(v, papel);
  const ocupado = aceptar.isPending || rechazar.isPending;

  return (
    <article className="rounded-2xl border border-border bg-surface transition-colors hover:border-border-strong">
      <Link
        to={`/vinculaciones/${v.id}`}
        className="flex items-center gap-4 rounded-2xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Avatar src={otro.foto} nombre={otro.nombre} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text-2">
            {papel === 'ensenando' ? 'Te pidió ' : 'Pediste a '}
            <span className="font-medium text-text-1">
              <UserName nombre={otro.nombre} inactivo={otro.inactivo} />
            </span>
          </p>
          <p className="mt-0.5 truncate font-display text-[17px] font-medium text-text-1">{v.oferta_titulo}</p>
          <p className="mt-1 text-xs text-text-2">
            {fechaCorta(v.created_at)}
            <span className="ml-2 sm:hidden">{etiquetaEstado(v.estado, papel)}</span>
            {confirmar && <span className="ml-2 font-medium text-accent">Falta tu confirmación</span>}
          </p>
        </div>
        <span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-medium sm:inline ${TONO[tonoEstado(v.estado, papel)]}`}>
          {etiquetaEstado(v.estado, papel)}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-3" aria-hidden />
      </Link>

      {responder && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <Button
            onClick={() =>
              aceptar.mutate(v.id, {
                onSuccess: () => toast.success('Aceptado. Ya pueden hablar por mensaje.'),
                onError: (err) => toastError(err, 'No se pudo aceptar.'),
              })
            }
            disabled={ocupado}
            className="px-4 py-2"
          >
            Aceptar
          </Button>
          <Button
            variant="danger-subtle"
            onClick={() =>
              rechazar.mutate(v.id, {
                onSuccess: () => toast.info('Solicitud rechazada'),
                onError: (err) => toastError(err, 'No se pudo rechazar.'),
              })
            }
            disabled={ocupado}
            className="px-4 py-2"
          >
            Rechazar
          </Button>
        </div>
      )}
    </article>
  );
}
