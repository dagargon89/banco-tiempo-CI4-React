import { CheckCircle2, Circle } from 'lucide-react';
import type { VinculacionCard } from '@/lib/types';
import type { Papel } from '@/lib/intercambio';

interface Props {
  vinculacion: VinculacionCard;
  papel: Papel;
}

/** Quién ya confirmó que el intercambio se dio. Hacen falta las dos partes. */
export default function PanelConfirmacion({ vinculacion: v, papel }: Props) {
  if (v.estado !== 'aceptada' && v.estado !== 'completada') return null;

  const primer = (n: string) => n.split(' ')[0];
  const items = [
    {
      label: papel === 'ensenando' ? 'Tú, que enseñas' : `${primer(v.oferente_nombre)}, que enseña`,
      ok: Boolean(Number(v.confirmado_oferente)),
    },
    {
      label: papel === 'aprendiendo' ? 'Tú, que aprendes' : `${primer(v.buscador_nombre)}, que aprende`,
      ok: Boolean(Number(v.confirmado_buscador)),
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-medium text-text-1">¿Ya se dio el intercambio?</h2>
      <ul className="mt-3 space-y-2">
        {items.map(({ label, ok }) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            {ok ? <CheckCircle2 className="h-5 w-5 text-success" aria-hidden /> : <Circle className="h-5 w-5 text-text-3" aria-hidden />}
            <span className={ok ? 'text-text-1' : 'text-text-2'}>
              {label}
              <span className="sr-only">{ok ? ': confirmado' : ': sin confirmar'}</span>
            </span>
          </li>
        ))}
      </ul>
      {v.estado === 'aceptada' && (
        <p className="mt-3 text-sm text-text-2">Cuando las dos partes confirmen, el intercambio queda terminado y podrán dejarse una reseña.</p>
      )}
    </div>
  );
}
