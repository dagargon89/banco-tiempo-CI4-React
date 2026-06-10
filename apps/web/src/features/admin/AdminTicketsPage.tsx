import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Paginacion from '@/features/ofertas/components/Paginacion';
import TicketEstadoBadge from './components/TicketEstadoBadge';
import { useAdminTickets, useAsignarTicket, useCambiarEstadoTicket } from './hooks/useAdminTickets';
import { toast, toastError } from '@/lib/toast';
import { useUrlFilters } from '@/lib/urlFilters';
import type { Ticket, EstadoTicket } from '@/lib/types';

const transiciones: Record<EstadoTicket, EstadoTicket[]> = {
  abierto: ['en_proceso', 'cerrado'],
  en_proceso: ['resuelto', 'cerrado'],
  resuelto: [],
  cerrado: [],
};

export default function AdminTicketsPage() {
  const { searchParams, setFilter, setPage } = useUrlFilters();
  const estado = searchParams.get('estado');
  const tipo = searchParams.get('tipo');
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') || '1');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [resolucion, setResolucion] = useState('');

  const filtros = useMemo(() => ({ estado, tipo, q: q || null, page, per_page: 20 }), [estado, tipo, q, page]);

  const { data, isLoading } = useAdminTickets(filtros);
  const asignar = useAsignarTicket();
  const cambiarEstado = useCambiarEstadoTicket();

  const tickets = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 20 };

  const handleCambiarEstado = (id: number) => {
    if (!nuevoEstado) return;
    cambiarEstado.mutate(
      { id, estado: nuevoEstado, resolucion: nuevoEstado === 'resuelto' ? resolucion : undefined },
      {
        onSuccess: () => {
          toast.success(`Ticket marcado como ${nuevoEstado}`);
          setExpandedId(null);
          setNuevoEstado('');
          setResolucion('');
        },
        onError: (err) => toastError(err, 'Error al cambiar el estado del ticket.'),
      },
    );
  };

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
      render: (t) => {
        const estadosDisponibles = transiciones[t.estado] ?? [];
        const expanded = expandedId === t.id;
        return (
          <div className="flex gap-2">
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
            {estadosDisponibles.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setExpandedId(expanded ? null : t.id);
                  setNuevoEstado('');
                  setResolucion('');
                }}
              >
                {expanded ? 'Cancelar' : 'Estado'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const renderExpandedRow = (t: Ticket) => {
    const estadosDisponibles = transiciones[t.estado] ?? [];
    if (expandedId !== t.id || estadosDisponibles.length === 0) return null;
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
        <select
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text-1"
        >
          <option value="">Seleccionar estado</option>
          {estadosDisponibles.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        {nuevoEstado === 'resuelto' && (
          <textarea
            value={resolucion}
            onChange={(e) => setResolucion(e.target.value)}
            placeholder="Resolucion (obligatoria)..."
            className="h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-1"
          />
        )}
        <Button
          variant="primary"
          onClick={() => handleCambiarEstado(t.id)}
          disabled={cambiarEstado.isPending || !nuevoEstado}
        >
          Confirmar
        </Button>
      </div>
    );
  };

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
        expandedRowId={expandedId}
        renderExpandedRow={renderExpandedRow}
      />

      {!isLoading && tickets.length > 0 && (
        <div className="mt-4">
          <Paginacion page={meta.page} total={meta.total} perPage={meta.per_page} onChange={setPage} />
        </div>
      )}
    </>
  );
}
