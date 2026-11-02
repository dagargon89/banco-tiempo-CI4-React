import { useParams, Link, useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import UserName from '@/components/ui/UserName';
import { useOfertaDetalle, useCambiarEstadoOferta } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';
import { useMarcarInteres } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { toast, toastError } from '@/lib/toast';
import { DetalleSkeleton } from '@/components/ui/Skeleton';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { describirDuracion } from '@/lib/duracion';

const DISPONIBILIDAD_LABEL: Record<string, string> = {
  mananas: 'Mañanas',
  tardes: 'Tardes',
  fines_semana: 'Fines de semana',
};

const ESTADO_LABEL: Record<string, string> = {
  activa: 'Publicada',
  pausada: 'Pausada',
  borrador: 'Borrador',
  eliminada: 'Eliminada',
};

export default function OfertaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: oferta, isLoading } = useOfertaDetalle(id!);
  const { data: categorias } = useCategorias();
  const cambiarEstado = useCambiarEstadoOferta();
  const marcarInteres = useMarcarInteres();

  const esDueno = user && oferta && user.id === oferta.user_id;

  const disponibilidad: string[] = (() => {
    if (!oferta?.disponibilidad) return [];
    try {
      const parsed = typeof oferta.disponibilidad === 'string' ? JSON.parse(oferta.disponibilidad) : oferta.disponibilidad;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const handleCambiarEstado = (estado: string) => {
    if (!oferta) return;
    if (estado === 'eliminada' && !confirm('Esta acción no se puede deshacer. ¿Continuar?')) return;
    cambiarEstado.mutate({ id: oferta.id, estado }, {
      onSuccess: () => {
        if (estado === 'eliminada') {
          toast.info('Oferta eliminada');
          navigate('/mis-ofertas');
        } else if (estado === 'pausada') {
          toast.info('Oferta pausada');
        } else if (estado === 'activa') {
          toast.success('Oferta reanudada');
        }
      },
      onError: (err) => toastError(err, 'No se pudo cambiar el estado.'),
    });
  };

  const handleMarcarInteres = () => {
    if (!oferta) return;
    marcarInteres.mutate(oferta.id, {
      onSuccess: () => toast.success('Interés registrado. Pronto el oferente verá tu solicitud.'),
      onError: (err) => toastError(err, 'Error al registrar interés.'),
    });
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      activa: 'success', pausada: 'warning', borrador: 'neutral', eliminada: 'error',
    };
    return map[estado] ?? 'neutral';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <DetalleSkeleton />
      </div>
    );
  }

  if (!oferta) {
    return <p className="text-center text-text-2">Oferta no encontrada.</p>;
  }

  const isFlag = (v: unknown): boolean => v === true || v === 1 || v === '1';
  const oferenteInactivo = isFlag((oferta as { oferente_inactivo?: boolean | number | string }).oferente_inactivo);
  const pausadaPorAdmin = isFlag((oferta as { pausada_por_admin?: number | string }).pausada_por_admin);

  const cat = categorias?.find((c) => Number(c.id) === Number(oferta.categoria_id));
  const catConfig = getCategoryConfig(cat?.slug);
  const CatIcon = catConfig.icon;
  const { total, detalle } = describirDuracion(oferta.duracion_sesion_min, oferta.num_sesiones);
  const puedeInteresar = !esDueno && oferta.estado === 'activa';
  const primerNombre = oferta.oferente_nombre.split(' ')[0];

  const detalles: { label: string; value: string }[] = [
    { label: 'Modalidad', value: oferta.modalidad === 'virtual' ? 'Virtual' : 'Presencial' },
    ...(oferta.zona ? [{ label: 'Zona', value: oferta.zona }] : []),
    ...(oferta.tipo_capacidad
      ? [{
          label: 'Grupo',
          value: oferta.tipo_capacidad === 'grupal'
            ? `Grupal${oferta.capacidad_maxima ? `, hasta ${oferta.capacidad_maxima} personas` : ''}`
            : 'Individual, una persona a la vez',
        }]
      : []),
    ...(disponibilidad.length > 0
      ? [{ label: 'Disponibilidad', value: disponibilidad.map((d) => DISPONIBILIDAD_LABEL[d] ?? d).join(', ') }]
      : []),
  ];

  const botonInteres = (
    <Button size="lg" fullWidth onClick={handleMarcarInteres} disabled={marcarInteres.isPending || oferenteInactivo}>
      {marcarInteres.isPending ? 'Enviando…' : 'Me interesa'}
    </Button>
  );

  return (
    <div className="mx-auto max-w-5xl pb-24 md:pb-0">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 space-y-8">
          <header>
            <p className="flex items-center gap-2 text-sm text-text-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-md ${catConfig.accent}`}>
                <CatIcon className="h-4 w-4" aria-hidden />
              </span>
              {cat?.nombre ?? 'Oferta'}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-text-1 sm:text-4xl">{oferta.titulo}</h1>
            <p className="mt-3 max-w-prose text-lg text-text-2">{oferta.descripcion_breve}</p>
            {esDueno && (
              <div className="mt-4">
                <Badge variant={estadoBadge(oferta.estado)}>{ESTADO_LABEL[oferta.estado] ?? oferta.estado}</Badge>
              </div>
            )}
          </header>

          {(oferenteInactivo || pausadaPorAdmin) && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
              Esta oferta está temporalmente fuera de servicio porque la cuenta del oferente fue dada de baja.
            </div>
          )}

          {oferta.descripcion_completa && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-text-1">Qué incluye</h2>
              <p className="max-w-prose whitespace-pre-line text-text-2">{oferta.descripcion_completa}</p>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-text-1">Cómo funciona</h2>
            <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
              {detalles.map((d) => (
                <div key={d.label} className="grid grid-cols-[7.5rem_1fr] gap-4 px-4 py-3 text-sm">
                  <dt className="text-text-2">{d.label}</dt>
                  <dd className="text-text-1">{d.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {oferta.imagenes && oferta.imagenes.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-text-1">Imágenes</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {oferta.imagenes.map((img) => (
                  <img key={img.id} src={img.ruta} alt="" className="aspect-square w-full rounded-lg border border-border object-cover" />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Panel lateral: el boleto, quién ofrece y la acción */}
        <aside className="space-y-4 md:sticky md:top-6 md:self-start">
          <div className="overflow-hidden rounded-xl bg-lime text-lime-ink">
            <div className="px-5 py-5">
              <p className="text-sm">Tiempo que se intercambia</p>
              {total ? (
                <>
                  <p className="mt-1 font-display text-4xl font-bold leading-none">{total}</p>
                  {detalle && <p className="mt-2 text-sm">{detalle}</p>}
                </>
              ) : (
                <p className="mt-1 font-display text-xl font-bold">Por acordar</p>
              )}
            </div>
            <p className="border-t-2 border-dashed border-lime-ink/40 px-5 py-3 text-sm">
              Cada hora que recibes la devuelves compartiendo algo que sabes.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="lg" />
              <div className="min-w-0">
                <p className="text-sm text-text-2">Ofrece</p>
                <p className="truncate font-semibold text-text-1">
                  <UserName nombre={oferta.oferente_nombre} inactivo={oferenteInactivo} />
                </p>
              </div>
            </div>
            {puedeInteresar && (
              <div className="mt-4 hidden md:block">
                {botonInteres}
                <p className="mt-3 text-xs text-text-2">
                  Le avisamos a {primerNombre} y podrán ponerse de acuerdo por mensaje.
                </p>
              </div>
            )}
          </div>

          {esDueno && (
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-4">
              <Link to={`/ofertas/${oferta.id}/editar`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              {oferta.estado === 'activa' && (
                <Button variant="secondary" onClick={() => handleCambiarEstado('pausada')} disabled={cambiarEstado.isPending}>
                  Pausar
                </Button>
              )}
              {oferta.estado === 'pausada' && (
                <Button onClick={() => handleCambiarEstado('activa')} disabled={cambiarEstado.isPending}>
                  Reanudar
                </Button>
              )}
              {oferta.estado !== 'eliminada' && (
                <Button
                  variant="subtle"
                  className="text-error"
                  onClick={() => handleCambiarEstado('eliminada')}
                  disabled={cambiarEstado.isPending}
                >
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>

      {puedeInteresar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 py-3 shadow-lg md:hidden">
          {botonInteres}
        </div>
      )}
    </div>
  );
}
