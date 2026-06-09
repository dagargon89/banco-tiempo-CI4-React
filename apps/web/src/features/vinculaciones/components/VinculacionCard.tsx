import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from './EstadoBadge';
import type { VinculacionCard as VinculacionCardType } from '@/lib/types';

interface VinculacionCardProps {
  vinculacion: VinculacionCardType;
  userId: number;
}

export default function VinculacionCard({ vinculacion, userId }: VinculacionCardProps) {
  const esOferente = userId === vinculacion.oferente_id;
  const contraparte = esOferente
    ? { nombre: vinculacion.buscador_nombre, foto: vinculacion.buscador_foto, rol: 'Buscador' }
    : { nombre: vinculacion.oferente_nombre, foto: vinculacion.oferente_foto, rol: 'Oferente' };

  return (
    <Link
      to={`/vinculaciones/${vinculacion.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30"
    >
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

      <p className="mt-2 text-xs text-text-3">
        {new Date(vinculacion.created_at).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </Link>
  );
}
