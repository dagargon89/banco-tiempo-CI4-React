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
      {/* Colored header — compact */}
      <div className={`flex items-center gap-2 ${catConfig.bg} px-3 py-2.5`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${catConfig.accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        {catNombre && (
          <span className="text-xs font-medium text-text-1">{catNombre}</span>
        )}
        <Badge variant="info" className="ml-auto">{oferta.modalidad}</Badge>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
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
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-2">
            <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="sm" />
            <span className="truncate text-xs text-text-2">{oferta.oferente_nombre}</span>
          </div>
          {oferta.oferente_calif && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-warning">
              <Star className="h-3 w-3 fill-current" /> {oferta.oferente_calif}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
