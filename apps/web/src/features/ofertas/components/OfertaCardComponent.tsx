import { Link } from 'react-router-dom';
import type { OfertaCard, Categoria } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { getCategoryConfigById } from '@/lib/categoryConfig';
import { MapPin, Users, Star } from 'lucide-react';

interface Props {
  oferta: OfertaCard;
  categorias?: Categoria[];
}

export default function OfertaCardComponent({ oferta, categorias }: Props) {
  const catConfig = getCategoryConfigById(oferta.categoria_id, categorias);
  const Icon = catConfig.icon;
  const catNombre = categorias?.find((c) => c.id === Number(oferta.categoria_id))?.nombre;

  return (
    <Link
      to={`/ofertas/${oferta.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
    >
      {/* Colored header */}
      <div className={`flex items-center justify-center bg-gradient-to-br ${catConfig.bg} py-6`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${catConfig.accent}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          {catNombre && <Badge variant="neutral">{catNombre}</Badge>}
          <Badge variant="info">{oferta.modalidad}</Badge>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold text-text-1">{oferta.titulo}</h3>
        <p className="line-clamp-2 text-xs text-text-2">{oferta.descripcion_breve}</p>

        {/* Location & capacity */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-3">
          {oferta.zona && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {oferta.zona}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> Individual
          </span>
        </div>

        {/* Oferente */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="sm" />
            <span className="text-xs text-text-2">{oferta.oferente_nombre}</span>
          </div>
          {oferta.oferente_calif && (
            <span className="flex items-center gap-0.5 text-xs text-warning">
              <Star className="h-3 w-3 fill-current" /> {oferta.oferente_calif}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
