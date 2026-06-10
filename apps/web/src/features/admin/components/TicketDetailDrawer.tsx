import { useState } from 'react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import UserName from '@/components/ui/UserName';
import TicketEstadoBadge from './TicketEstadoBadge';
import { useTicketDetalleAdmin } from '../hooks/useTicketDetalleAdmin';
import { useCambiarEstadoTicket } from '../hooks/useAdminTickets';
import { toast, toastError } from '@/lib/toast';

interface Props {
  ticketId: number | null;
  open: boolean;
  onClose: () => void;
}

const transiciones: Record<string, string[]> = {
  abierto: ['en_proceso', 'cerrado'],
  en_proceso: ['resuelto', 'cerrado'],
  resuelto: [],
  cerrado: [],
};

export default function TicketDetailDrawer({ ticketId, open, onClose }: Props) {
  const { data: ticket, isLoading } = useTicketDetalleAdmin(ticketId);
  const cambiarEstado = useCambiarEstadoTicket();
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [resolucion, setResolucion] = useState('');

  const estadosDisponibles = ticket ? (transiciones[ticket.estado] ?? []) : [];

  const handleCambiar = () => {
    if (!ticket || !nuevoEstado) return;
    cambiarEstado.mutate(
      { id: ticket.id, estado: nuevoEstado, resolucion: nuevoEstado === 'resuelto' ? resolucion : undefined },
      {
        onSuccess: () => {
          toast.success(`Ticket actualizado a ${nuevoEstado}`);
          setNuevoEstado('');
          setResolucion('');
          onClose();
        },
        onError: (err) => toastError(err, 'Error al cambiar estado.'),
      },
    );
  };

  const footer = ticket && estadosDisponibles.length > 0 && (
    <div className="flex flex-col gap-2">
      <select
        value={nuevoEstado}
        onChange={(e) => setNuevoEstado(e.target.value)}
        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text-1"
      >
        <option value="">Cambiar estado a...</option>
        {estadosDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      {nuevoEstado === 'resuelto' && (
        <textarea
          value={resolucion}
          onChange={(e) => setResolucion(e.target.value)}
          placeholder="Resolución..."
          className="h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-1"
        />
      )}
      <Button onClick={handleCambiar} disabled={!nuevoEstado || cambiarEstado.isPending}>
        Confirmar cambio
      </Button>
    </div>
  );

  return (
    <DetailDrawer open={open} onClose={onClose} title={ticket?.folio ?? 'Detalle de ticket'} footer={footer || undefined}>
      {isLoading || !ticket ? (
        <p className="text-sm text-text-3">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <TicketEstadoBadge estado={ticket.estado as 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado'} />
            <Badge variant={ticket.tipo === 'reporte' ? 'error' : 'info'}>{ticket.tipo}</Badge>
          </div>

          <div>
            <p className="text-xs text-text-3">Creador</p>
            <p className="text-sm text-text-1">
              <UserName nombre={ticket.creador_nombre ?? '—'} inactivo={Boolean(ticket.creador_inactivo)} />
            </p>
          </div>

          {ticket.asignado_a_nombre && (
            <div>
              <p className="text-xs text-text-3">Asignado a</p>
              <p className="text-sm text-text-1">{ticket.asignado_a_nombre}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-text-3">Descripción</p>
            <p className="whitespace-pre-line text-sm text-text-1">{ticket.descripcion}</p>
          </div>

          {ticket.resolucion && (
            <div className="rounded-lg bg-success/5 p-3">
              <p className="text-xs font-medium text-success">Resolución</p>
              <p className="text-sm text-text-2">{ticket.resolucion}</p>
            </div>
          )}

          {ticket.historial && ticket.historial.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-text-3">Historial</p>
              <ul className="space-y-1 text-xs text-text-2">
                {ticket.historial.map((h, i) => (
                  <li key={i} className="border-l-2 border-border pl-2">
                    {h.accion} · {new Date(h.created_at).toLocaleString('es-MX')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DetailDrawer>
  );
}
