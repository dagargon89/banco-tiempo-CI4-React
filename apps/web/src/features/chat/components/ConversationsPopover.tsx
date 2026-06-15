import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from '@/features/vinculaciones/components/EstadoBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { useBubbleStore } from '@/stores/bubbleStore';
import type { VinculacionCard } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConversationsPopover({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const abrirBurbuja = useBubbleStore((s) => s.abrir);

  const { data: aceptadas, isLoading: loadingA } = useListarVinculaciones({ estado: 'aceptada', per_page: 50 });
  const { data: completadas, isLoading: loadingC } = useListarVinculaciones({ estado: 'completada', per_page: 50 });

  if (!open) return null;

  const isLoading = loadingA || loadingC;
  const vinculaciones: VinculacionCard[] = [
    ...(aceptadas?.data ?? []),
    ...(completadas?.data ?? []),
  ];

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 flex max-h-[480px] w-80 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
      role="menu"
      aria-label="Conversaciones"
    >
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-sm font-semibold text-text-1">Mensajes</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8" role="status" aria-label="Cargando">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : vinculaciones.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={<MessageCircle className="h-8 w-8" />}
              title="Sin conversaciones"
              subtitle="Las conversaciones aparecen cuando una vinculación es aceptada"
            />
          </div>
        ) : (
          <ul>
            {vinculaciones.map((v) => {
              const contraparte =
                user?.id === v.buscador_id
                  ? { id: v.oferente_id, nombre: v.oferente_nombre, foto: v.oferente_foto }
                  : { id: v.buscador_id, nombre: v.buscador_nombre, foto: v.buscador_foto };
              const isInactivo = (val: unknown): boolean => val === true || val === 1 || val === '1';
              const otroInactivo = user?.id === v.buscador_id
                ? isInactivo(v.oferente_inactivo)
                : isInactivo(v.buscador_inactivo);

              return (
                <li key={v.id}>
                  <button
                    onClick={() => {
                      abrirBurbuja({
                        vinculacionId: v.id,
                        contraparte,
                        ofertaTitulo: v.oferta_titulo,
                        otroInactivo,
                      });
                      onClose();
                    }}
                    aria-label={contraparte.nombre}
                    className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
                      <p className="truncate text-xs text-text-3">{v.oferta_titulo}</p>
                    </div>
                    <EstadoBadge estado={v.estado} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border bg-surface-2 px-4 py-2 text-center">
        <Link
          to="/mensajes"
          onClick={onClose}
          className="text-xs font-medium text-accent hover:underline"
        >
          Ver todos los mensajes
        </Link>
      </div>
    </div>
  );
}
