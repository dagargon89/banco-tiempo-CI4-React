import { useState } from 'react';
import { useCrearResena } from '../hooks/useResenas';
import EstrellaRating from './EstrellaRating';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

interface Props {
  vinculacionId: number;
}

export default function ResenaForm({ vinculacionId }: Props) {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const crear = useCrearResena();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calificacion < 1) return;

    crear.mutate({
      vinculacionId,
      calificacion,
      comentario: comentario.trim() || undefined,
    });
  };

  if (crear.isSuccess) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
        <p className="text-sm font-medium text-success">Resena enviada correctamente</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-1">Deja tu resena</h3>

      <div>
        <p className="mb-2 text-xs text-text-2">Calificacion</p>
        <EstrellaRating value={calificacion} onChange={setCalificacion} />
        {calificacion < 1 && crear.isError && (
          <p className="mt-1 text-xs text-error">Selecciona una calificacion</p>
        )}
      </div>

      <Textarea
        label="Comentario (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxChars={2000}
        currentLength={comentario.length}
        placeholder="Comparte tu experiencia..."
        rows={3}
      />

      {crear.isError && (
        <p className="text-xs text-error">
          {(crear.error as any)?.response?.data?.message ?? 'Error al enviar la resena.'}
        </p>
      )}

      <Button type="submit" disabled={calificacion < 1 || crear.isPending}>
        {crear.isPending ? 'Enviando...' : 'Enviar resena'}
      </Button>
    </form>
  );
}
