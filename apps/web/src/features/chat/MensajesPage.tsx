import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { VinculacionCardSkeleton } from '@/components/ui/Skeleton';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { useBubbleStore } from '@/stores/bubbleStore';
import { contraparte, papelEn } from '@/lib/intercambio';

/** Conversaciones de los intercambios aceptados o terminados, en los dos papeles. */
export default function MensajesPage() {
  const user = useAuthStore((s) => s.user);
  const abrirBurbuja = useBubbleStore((s) => s.abrir);

  const { data: aceptadas, isLoading: loadingA } = useListarVinculaciones({ estado: 'aceptada', per_page: 50 });
  const { data: completadas, isLoading: loadingC } = useListarVinculaciones({ estado: 'completada', per_page: 50 });
  const isLoading = loadingA || loadingC;
  const conversaciones = [...(aceptadas?.data ?? []), ...(completadas?.data ?? [])];
  const isFlag = (v: unknown): boolean => v === true || v === 1 || v === '1';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Mensajes" subtitle="Cada intercambio aceptado tiene su conversación." />

      {isLoading ? (
        <div className="space-y-3">
          <VinculacionCardSkeleton />
          <VinculacionCardSkeleton />
        </div>
      ) : conversaciones.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title="Todavía no tienes conversaciones"
          subtitle="Cuando alguien acepte un intercambio contigo, la conversación aparece aquí."
          action={{ label: 'Explorar ofertas', to: '/inicio' }}
        />
      ) : (
        <ul className="space-y-3">
          {conversaciones.map((v) => {
            const papel = papelEn(v, user!.id);
            const otro = contraparte(v, papel);
            const c = papel === 'ensenando'
              ? { id: v.buscador_id, nombre: v.buscador_nombre, foto: v.buscador_foto }
              : { id: v.oferente_id, nombre: v.oferente_nombre, foto: v.oferente_foto };
            return (
              <li key={v.id} className="flex items-center gap-2 rounded-2xl border border-border bg-surface pr-2 transition-colors hover:border-border-strong">
                <Link to={`/vinculaciones/${v.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-4">
                  <Avatar src={otro.foto} nombre={otro.nombre} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-1">{otro.nombre}</p>
                    <p className="truncate text-sm text-text-2">
                      {papel === 'ensenando' ? 'Aprende contigo: ' : 'Te enseña: '}
                      {v.oferta_titulo}
                    </p>
                  </div>
                  {v.estado === 'completada' && (
                    <span className="hidden shrink-0 rounded-full bg-surface-2 px-3 py-1 text-xs text-text-2 sm:inline">Terminado</span>
                  )}
                </Link>
                <button
                  onClick={() => abrirBurbuja({ vinculacionId: v.id, contraparte: c, ofertaTitulo: v.oferta_titulo, otroInactivo: isFlag(otro.inactivo) })}
                  aria-label={`Abrir chat flotante con ${otro.nombre}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface-2 hover:text-accent"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
