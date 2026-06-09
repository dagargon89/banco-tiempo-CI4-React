import { Flag } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EstrellaRating from './EstrellaRating';
import { useReportarResena } from '../hooks/useResenas';
import { useAuthStore } from '@/stores/authStore';
import type { Resena } from '@/lib/types';

interface Props {
  resena: Resena;
}

export default function ResenaCard({ resena }: Props) {
  const user = useAuthStore((s) => s.user);
  const reportar = useReportarResena();

  const fecha = new Date(resena.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar src={resena.autor_foto} nombre={resena.autor_nombre} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-1">{resena.autor_nombre}</p>
            <span className="text-xs text-text-3">{fecha}</span>
          </div>
          <EstrellaRating value={resena.calificacion} readonly size="sm" />
          <p className="mt-1 text-xs text-text-3">{resena.oferta_titulo}</p>
          {resena.comentario && (
            <p className="mt-2 text-sm text-text-2">{resena.comentario}</p>
          )}
        </div>
      </div>
      {user && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => reportar.mutate(resena.id)}
            disabled={reportar.isPending}
            className="flex items-center gap-1 text-xs text-text-3 transition-colors hover:text-error"
          >
            <Flag className="h-3 w-3" />
            Reportar
          </button>
        </div>
      )}
    </div>
  );
}
