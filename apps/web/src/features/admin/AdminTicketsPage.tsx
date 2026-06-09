import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Paginacion from '@/features/ofertas/components/Paginacion';
import TicketEstadoBadge from './components/TicketEstadoBadge';
import { useAdminTickets, useAsignarTicket, useCambiarEstadoTicket } from './hooks/useAdminTickets';
import type { Ticket, EstadoTicket } from '@/lib/types';

const transiciones: Record<EstadoTicket, EstadoTicket[]> = {
  abierto: ['en_proceso', 'cerrado'],
  en_proceso: ['resuelto', 'cerrado'],
  resuelto: [],
  cerrado: [],
};

function getErrorMsg(error: unknown): string {
  const resp = (error as any)?.response?.data;
  return resp?.message ?? 'Error inesperado.';
}

export default function AdminTicketsPage() {
  const [estado, setEstado] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [resolucion, setResolucion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtros = useMemo(() => ({ estado, tipo, page, per_page: 20 }), [estado, tipo, page]);

  const { data, isLoading } = useAdminTickets(filtros);
  const asignar = useAsignarTicket();
  const cambiarEstado = useCambiarEstadoTicket();

  const tickets = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 20 };

  const handleCambiarEstado = (id: number) => {
    if (!nuevoEstado) return;
    setErrorMsg(null);
    cambiarEstado.mutate(
      { id, estado: nuevoEstado, resolucion: nuevoEstado === 'resuelto' ? resolucion : undefined },
      {
        onSuccess: () => {
          setExpandedId(null);
          setNuevoEstado('');
          setResolucion('');
        },
        onError: (err) => setErrorMsg(getErrorMsg(err)),
      },
    );
  };

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Gestion de tickets</h1>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="ml-2 underline">Cerrar</button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Estado</label>
          <select
            value={estado ?? ''}
            onChange={(e) => { setEstado(e.target.value || null); setPage(1); }}
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
            onChange={(e) => { setTipo(e.target.value || null); setPage(1); }}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="reporte">Reporte</option>
            <option value="sugerencia">Sugerencia</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState title="No hay tickets" subtitle="No se encontraron tickets con los filtros seleccionados." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-text-2">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creador</th>
                  <th className="px-4 py-3">Entidad</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {tickets.map((t: Ticket) => {
                  const estadosDisponibles = transiciones[t.estado] ?? [];
                  const expanded = expandedId === t.id;

                  return (
                    <tr key={t.id} className="group">
                      <td className="px-4 py-3 font-mono text-xs text-text-1">{t.folio}</td>
                      <td className="px-4 py-3">
                        <Badge variant={t.tipo === 'reporte' ? 'error' : 'info'}>{t.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3"><TicketEstadoBadge estado={t.estado} /></td>
                      <td className="px-4 py-3 text-text-2">{t.creador_nombre ?? `#${t.creador_id}`}</td>
                      <td className="px-4 py-3 text-text-3">{t.entidad_tipo}{t.entidad_id ? ` #${t.entidad_id}` : ''}</td>
                      <td className="px-4 py-3 text-text-2">{t.asignado_a_nombre ?? '-'}</td>
                      <td className="px-4 py-3 text-text-3">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {['abierto', 'en_proceso'].includes(t.estado) && (
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setErrorMsg(null);
                                  asignar.mutate(t.id, {
                                    onError: (err) => setErrorMsg(getErrorMsg(err)),
                                  });
                                }}
                                disabled={asignar.isPending}
                              >
                                {asignar.isPending ? 'Asignando...' : 'Tomar'}
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
                          {expanded && (
                            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">
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
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Paginacion page={meta.page} total={meta.total} perPage={meta.per_page} onChange={setPage} />
          </div>
        </>
      )}
    </>
  );
}
