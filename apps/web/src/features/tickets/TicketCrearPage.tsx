import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCrearTicket } from './hooks/useTickets';
import { toast, toastError } from '@/lib/toast';

export default function TicketCrearPage() {
  const navigate = useNavigate();
  const crearTicket = useCrearTicket();

  const [tipo, setTipo] = useState('reporte');
  const [entidadTipo, setEntidadTipo] = useState('otro');
  const [entidadId, setEntidadId] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    crearTicket.mutate(
      {
        tipo,
        entidad_tipo: entidadTipo,
        entidad_id: entidadId ? Number(entidadId) : undefined,
        descripcion,
      },
      {
        onSuccess: () => {
          toast.success('Ticket enviado. Te responderemos pronto.');
          navigate('/mis-tickets');
        },
        onError: (err) => toastError(err, 'Error al crear ticket.'),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Crear ticket de soporte</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-2">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="reporte">Reporte</option>
            <option value="sugerencia">Sugerencia</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-2">Entidad relacionada</label>
          <select
            value={entidadTipo}
            onChange={(e) => setEntidadTipo(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="usuario">Usuario</option>
            <option value="oferta">Oferta</option>
            <option value="mensaje">Mensaje</option>
            <option value="resena">Resena</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-2">ID de la entidad (opcional)</label>
          <Input
            type="number"
            placeholder="Ej: 42"
            value={entidadId}
            onChange={(e) => setEntidadId(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-2">Descripcion</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="Describe el problema o sugerencia con al menos 10 caracteres..."
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <span className="text-xs text-text-3">{descripcion.length}/2000</span>
        </div>

        <Button type="submit" disabled={crearTicket.isPending || descripcion.length < 10}>
          {crearTicket.isPending ? 'Creando...' : 'Enviar ticket'}
        </Button>
      </form>
    </div>
  );
}
