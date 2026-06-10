import { useState, useMemo } from 'react';
import { Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Paginacion from '@/features/ofertas/components/Paginacion';
import TicketEstadoBadge from './components/TicketEstadoBadge';
import TicketDetailDrawer from './components/TicketDetailDrawer';
import { useAdminTickets, useAsignarTicket } from './hooks/useAdminTickets';
import { toast, toastError } from '@/lib/toast';
import { useUrlFilters } from '@/lib/urlFilters';
import type { Ticket } from '@/lib/types';

export default function AdminTicketsPage() {
  const { searchParams, setFilter, setPage } = useUrlFilters();
  const estado = searchParams.get('estado');
  const tipo = searchParams.get('tipo');
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') || '1');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const filtros = useMemo(() => ({ estado, tipo, q: q || null, page, per_page: 20 }), [estado, tipo, q, page]);

  const { data, isLoading } = useAdminTickets(filtros);
  const asignar = useAsignarTicket();

  const tickets = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 20 };

  const columns: Column<Ticket>[] = [
    { key: 'folio', header: 'Folio', render: (t) => <span className="font-mono text-xs text-text-1">{t.folio}</span> },
    {
      key: 'tipo', header: 'Tipo',
      render: (t) => <Badge variant={t.tipo === 'reporte' ? 'error' : 'info'}>{t.tipo}</Badge>,
    },
    { key: 'estado', header: 'Estado', render: (t) => <TicketEstadoBadge estado={t.estado} /> },
    { key: 'creador', header: 'Creador', hideOnMobile: true, render: (t) => <span className="text-text-2">{t.creador_nombre ?? `#${t.creador_id}`}</span> },
    {
      key: 'entidad', header: 'Entidad', hideOnMobile: true,
      render: (t) => <span className="text-text-3">{t.entidad_tipo}{t.entidad_id ? ` #${t.entidad_id}` : ''}</span>,
    },
    { key: 'asignado', header: 'Asignado', hideOnMobile: true, render: (t) => <span className="text-text-2">{t.asignado_a_nombre ?? '-'}</span> },
    {
      key: 'fecha', header: 'Fecha', hideOnMobile: true,
      render: (t) => <span className="text-text-3">{new Date(t.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'acciones', header: 'Acciones',
      render: (t) => (
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedTicketId(t.id)}
            aria-label="Ver detalle"
            className="rounded p-1.5 text-text-3 hover:bg-surface-2 hover:text-accent"
          >
            <Eye className="h-4 w-4" />
          </button>
          {['abierto', 'en_proceso'].includes(t.estado) && (
            <Button
              variant="secondary"
              onClick={() =>
                asignar.mutate(t.id, {
                  onSuccess: () => toast.success('Ticket asignado a ti'),
                  onError: (err) => toastError(err, 'Error al tomar el ticket.'),
                })
              }
              disabled={asignar.isPending}
            >
              {asignar.isPending ? '...' : 'Tomar'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Gestion de tickets</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Estado</label>
          <select
            value={estado ?? ''}
            onChange={(e) => setFilter('estado', e.target.value || null)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="abierto">Abierto</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Tipo</label>
          <select
            value={tipo ?? ''}
            onChange={(e) => setFilter('tipo', e.target.value || null)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="reporte">Reporte</option>
            <option value="sugerencia">Sugerencia</option>
          </select>
        </div>

        <div className="w-48">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setFilter('q', e.target.value || null)} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        skeletonRows={6}
        emptyTitle="No hay tickets"
        emptySubtitle="No se encontraron tickets con los filtros seleccionados."
        rowKey={(t) => t.id}
      />

      {!isLoading && tickets.length > 0 && (
        <div className="mt-4">
          <Paginacion page={meta.page} total={meta.total} perPage={meta.per_page} onChange={setPage} />
        </div>
      )}

      <TicketDetailDrawer
        ticketId={selectedTicketId}
        open={selectedTicketId != null}
        onClose={() => setSelectedTicketId(null)}
      />
    </>
  );
}
