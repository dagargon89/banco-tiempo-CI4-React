import { Link } from 'react-router-dom';
import { Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import PageHeader, { SectionTitle } from '@/components/ui/PageHeader';
import PillLink from '@/components/ui/PillLink';
import EmptyState from '@/components/ui/EmptyState';
import { OfertaCardSkeleton } from '@/components/ui/Skeleton';
import OfertaCardComponent from './components/OfertaCardComponent';
import IntercambiosSeccion from '@/features/vinculaciones/components/IntercambiosSeccion';
import { useMisOfertas, useCambiarEstadoOferta } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';
import { useAuthStore } from '@/stores/authStore';
import { toast, toastError } from '@/lib/toast';
import type { OfertaDetalle } from '@/lib/types';

const control =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

/** Todo lo que la persona ofrece: la mitad "enseñar" del intercambio. */
export default function EnsenandoPage() {
  const user = useAuthStore((s) => s.user);
  const { data: ofertas, isLoading } = useMisOfertas();
  const { data: categorias } = useCategorias();
  const cambiarEstado = useCambiarEstadoOferta();

  const cambiar = (oferta: OfertaDetalle, estado: string) => {
    if (estado === 'eliminada' && !confirm(`¿Eliminar «${oferta.titulo}»? Esta acción no se puede deshacer.`)) return;
    cambiarEstado.mutate(
      { id: oferta.id, estado },
      {
        onSuccess: () => {
          if (estado === 'eliminada') toast.info('Oferta eliminada');
          else if (estado === 'pausada') toast.info('Oferta pausada. Ya no aparece al explorar.');
          else toast.success('Oferta publicada de nuevo');
        },
        onError: (err) => toastError(err, 'No se pudo cambiar la oferta.'),
      },
    );
  };

  const lista = ofertas ?? [];
  const publicadas = lista.filter((o) => o.estado === 'activa').length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Enseñando"
        subtitle="Lo que ofreces, quién te lo pidió y los intercambios que tienes en marcha."
        actions={
          <PillLink to="/ofertas/nueva">
            <Plus className="h-4 w-4" aria-hidden /> Nueva oferta
          </PillLink>
        }
      />

      <IntercambiosSeccion titulo="Por responder" papel="ensenando" estado="solicitada" />
      <IntercambiosSeccion titulo="En curso" papel="ensenando" estado="aceptada" />

      <section className="mb-12">
        <SectionTitle
          count={lista.length}
          aside={lista.length > 0 && <span className="text-sm text-text-2">{publicadas === 1 ? '1 publicada' : `${publicadas} publicadas`}</span>}
        >
          Tus ofertas
        </SectionTitle>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <OfertaCardSkeleton />
            <OfertaCardSkeleton />
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            title="Todavía no ofreces nada"
            subtitle="Publica algo que sepas hacer. Cuando alguien te lo pida, aparecerá en «Por responder»."
            action={{ label: 'Publicar una oferta', to: '/ofertas/nueva' }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map((oferta) => {
              const pausada = oferta.estado === 'pausada';
              return (
                <div key={oferta.id} className={pausada ? 'opacity-75' : ''}>
                  <OfertaCardComponent
                    oferta={{ ...oferta, oferente_nombre: user?.nombre ?? '', oferente_foto: user?.foto_perfil ?? null }}
                    categorias={categorias}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1 px-1">
                    {pausada && <span className="mr-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-text-2">Pausada</span>}
                    <Link to={`/ofertas/${oferta.id}/editar`} className={`${control} text-text-2 hover:bg-surface hover:text-text-1`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                    </Link>
                    {oferta.estado === 'activa' && (
                      <button type="button" onClick={() => cambiar(oferta, 'pausada')} disabled={cambiarEstado.isPending} className={`${control} text-text-2 hover:bg-surface hover:text-text-1`}>
                        <Pause className="h-3.5 w-3.5" aria-hidden /> Pausar
                      </button>
                    )}
                    {pausada && (
                      <button type="button" onClick={() => cambiar(oferta, 'activa')} disabled={cambiarEstado.isPending} className={`${control} text-text-2 hover:bg-surface hover:text-text-1`}>
                        <Play className="h-3.5 w-3.5" aria-hidden /> Publicar de nuevo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cambiar(oferta, 'eliminada')}
                      disabled={cambiarEstado.isPending}
                      className={`${control} ml-auto text-error hover:bg-error/10`}
                      aria-label={`Eliminar ${oferta.titulo}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <IntercambiosSeccion titulo="Terminados" papel="ensenando" estado="completada,rechazada,cancelada" limite={4} />
    </div>
  );
}
