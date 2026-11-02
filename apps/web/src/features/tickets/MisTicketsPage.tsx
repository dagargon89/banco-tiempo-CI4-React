import { useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { TicketCardSkeleton } from '@/components/ui/Skeleton';
import Paginacion from '@/features/ofertas/components/Paginacion';
import TicketEstadoBadge from '@/features/admin/components/TicketEstadoBadge';
import { useMisTickets } from './hooks/useTickets';
import type { Ticket } from '@/lib/types';
import { etiqueta, TIPO_TICKET } from '@/lib/etiquetas';
import PageHeader from '@/components/ui/PageHeader';
import PillLink from '@/components/ui/PillLink';

export default function MisTicketsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMisTickets(page);

  const tickets: Ticket[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 20 };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Soporte"
        subtitle="Reporta un problema o sugiere una mejora. Aquí ves la respuesta del equipo."
        actions={
          <PillLink to="/tickets/crear">
            <Plus className="h-4 w-4" aria-hidden /> Nuevo ticket
          </PillLink>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <TicketCardSkeleton key={i} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="h-10 w-10" />}
          title="No tienes tickets"
          subtitle="Crea un ticket si necesitas reportar algo o hacer una sugerencia."
          action={{ label: 'Crear ticket', to: '/tickets/crear' }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-mono text-xs text-text-3">{t.folio}</span>
                  <Badge variant={t.tipo === 'reporte' ? 'error' : 'info'}>{etiqueta(TIPO_TICKET, t.tipo)}</Badge>
                  <TicketEstadoBadge estado={t.estado} />
                </div>
                <p className="mb-2 line-clamp-2 text-sm text-text-1">{t.descripcion}</p>
                <div className="flex items-center gap-4 text-xs text-text-3">
                  <span>{t.entidad_tipo}{t.entidad_id ? ` #${t.entidad_id}` : ''}</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                {t.resolucion && (
                  <div className="mt-3 rounded-lg bg-success/5 p-3">
                    <p className="text-xs font-medium text-success">Resolución:</p>
                    <p className="text-sm text-text-2">{t.resolucion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {meta.total > meta.per_page && (
            <div className="mt-4">
              <Paginacion page={meta.page} total={meta.total} perPage={meta.per_page} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
