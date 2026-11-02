import { Link } from 'react-router-dom';
import type { OfertaCard, Categoria } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';
import { getCategoryConfigById } from '@/lib/categoryConfig';
import { describirDuracion } from '@/lib/duracion';
import { MapPin, Star } from 'lucide-react';

interface Props {
  oferta: OfertaCard;
  categorias?: Categoria[];
  /** Destino del enlace. Por defecto, el detalle de la oferta. */
  href?: string;
}

const MODALIDAD: Record<string, string> = { presencial: 'Presencial', virtual: 'Virtual' };

/**
 * Boleto de tiempo: el cuerpo describe la oferta y el talón lima dice cuánto
 * tiempo cuesta. Es el único elemento de la interfaz que usa el lima de fondo.
 */
export default function OfertaCardComponent({ oferta, categorias, href }: Props) {
  const catConfig = getCategoryConfigById(oferta.categoria_id, categorias);
  const Icon = catConfig.icon;
  const catNombre = categorias?.find((c) => Number(c.id) === Number(oferta.categoria_id))?.nombre;
  const { total, detalle } = describirDuracion(oferta.duracion_sesion_min, oferta.num_sesiones);
  const meta = [catNombre, MODALIDAD[oferta.modalidad] ?? oferta.modalidad].filter(Boolean).join(', ');

  return (
    <Link
      to={href ?? `/ofertas/${oferta.id}`}
      className="group flex overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs text-text-2">
          <Icon className={`h-4 w-4 shrink-0 ${catConfig.ink}`} aria-hidden />
          <span className="truncate">{meta}</span>
        </p>
        <h3 className="mt-2 line-clamp-2 font-display text-[17px] font-semibold leading-snug text-text-1 group-hover:text-accent">
          {oferta.titulo}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-text-2">{oferta.descripcion_breve}</p>

        <div className="mt-auto flex min-w-0 items-center gap-2 pt-4">
          <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="sm" />
          <span className="truncate text-sm text-text-1">{oferta.oferente_nombre}</span>
          {oferta.oferente_calif ? (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-text-2">
              <Star className="h-3 w-3 fill-current text-warning" aria-hidden /> {oferta.oferente_calif}
            </span>
          ) : null}
          {oferta.zona && (
            <span className="ml-auto flex min-w-0 items-center gap-1 text-xs text-text-2">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{oferta.zona}</span>
            </span>
          )}
        </div>
      </div>

      <div className="boleto-talon flex w-24 shrink-0 flex-col items-center justify-center px-2 py-4 text-center">
        {total ? (
          <>
            <span className={`font-display font-bold leading-none whitespace-nowrap ${total.length > 6 ? 'text-lg' : 'text-2xl'}`}>{total}</span>
            {detalle && <span className="mt-1.5 text-xs leading-tight">{detalle}</span>}
          </>
        ) : (
          <span className="text-xs font-medium leading-tight">Tiempo por acordar</span>
        )}
      </div>
    </Link>
  );
}
