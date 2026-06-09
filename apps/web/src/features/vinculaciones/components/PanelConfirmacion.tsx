import type { VinculacionCard } from '@/lib/types';
import { CheckCircle2, Circle } from 'lucide-react';

interface PanelConfirmacionProps {
  vinculacion: VinculacionCard;
}

export default function PanelConfirmacion({ vinculacion }: PanelConfirmacionProps) {
  if (vinculacion.estado !== 'aceptada' && vinculacion.estado !== 'completada') {
    return null;
  }

  const items = [
    {
      label: `Oferente (${vinculacion.oferente_nombre})`,
      confirmed: Boolean(Number(vinculacion.confirmado_oferente)),
    },
    {
      label: `Buscador (${vinculacion.buscador_nombre})`,
      confirmed: Boolean(Number(vinculacion.confirmado_buscador)),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-1">Confirmacion de prestacion</h3>
      <div className="space-y-2">
        {items.map(({ label, confirmed }) => (
          <div key={label} className="flex items-center gap-2">
            {confirmed ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-text-3" />
            )}
            <span className={`text-sm ${confirmed ? 'text-text-1' : 'text-text-3'}`}>{label}</span>
          </div>
        ))}
      </div>
      {vinculacion.estado === 'aceptada' && (
        <p className="mt-3 text-xs text-text-3">
          Ambas partes deben confirmar para completar la vinculacion.
        </p>
      )}
    </div>
  );
}
