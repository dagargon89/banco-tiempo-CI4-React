import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from '@/features/vinculaciones/components/EstadoBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import type { VinculacionCard } from '@/lib/types';

export default function MensajesPage() {
  const user = useAuthStore((s) => s.user);

  const { data: aceptadas, isLoading: loadingA } = useListarVinculaciones({
    estado: 'aceptada',
    per_page: 50,
  });
  const { data: completadas, isLoading: loadingC } = useListarVinculaciones({
    estado: 'completada',
    per_page: 50,
  });

  const isLoading = loadingA || loadingC;
  const vinculaciones: VinculacionCard[] = [
    ...(aceptadas?.data ?? []),
    ...(completadas?.data ?? []),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Mensajes</h1>

      {vinculaciones.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title="Sin conversaciones"
          subtitle="Las conversaciones aparecen cuando una vinculacion es aceptada"
        />
      ) : (
        <div className="space-y-3">
          {vinculaciones.map((v) => {
            const contraparte =
              user?.id === v.buscador_id
                ? { nombre: v.oferente_nombre, foto: v.oferente_foto }
                : { nombre: v.buscador_nombre, foto: v.buscador_foto };

            return (
              <Link
                key={v.id}
                to={`/vinculaciones/${v.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30"
              >
                <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-1">
                    {contraparte.nombre}
                  </p>
                  <p className="truncate text-xs text-text-3">{v.oferta_titulo}</p>
                </div>
                <EstadoBadge estado={v.estado} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
