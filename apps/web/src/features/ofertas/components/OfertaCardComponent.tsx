import { Link } from 'react-router-dom';
import type { OfertaCard } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

interface Props {
  oferta: OfertaCard;
}

export default function OfertaCardComponent({ oferta }: Props) {
  return (
    <Link
      to={`/ofertas/${oferta.id}`}
      className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <h3 className="line-clamp-2 text-sm font-semibold text-text-1">{oferta.titulo}</h3>
      <p className="line-clamp-2 text-xs text-text-2">{oferta.descripcion_breve}</p>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="info">{oferta.modalidad}</Badge>
        {oferta.zona && (
          <Badge variant="neutral">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {oferta.zona}
          </Badge>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="sm" />
        <span className="text-xs text-text-2">{oferta.oferente_nombre}</span>
      </div>
    </Link>
  );
}
