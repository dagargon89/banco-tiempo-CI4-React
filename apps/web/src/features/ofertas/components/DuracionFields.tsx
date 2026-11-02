import { describirDuracion } from '@/lib/duracion';

const DURACIONES = [15, 30, 45, 60, 90, 120, 180, 240];

interface Props {
  duracion: string;
  sesiones: string;
  onDuracionChange: (v: string) => void;
  onSesionesChange: (v: string) => void;
}

const control =
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15';

/** Duración por sesión y número de sesiones, con el total en vivo. */
export default function DuracionFields({ duracion, sesiones, onDuracionChange, onSesionesChange }: Props) {
  const { total, detalle } = describirDuracion(duracion, sesiones);

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-text-1">Tiempo que ofreces</legend>
      <p className="mb-3 text-sm text-text-2">Es opcional, pero ayuda a que la gente sepa cuánto tiempo va a intercambiar.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="duracion-sesion" className="text-sm font-medium text-text-1">Duración de cada sesión</label>
          <select id="duracion-sesion" value={duracion} onChange={(e) => onDuracionChange(e.target.value)} className={control}>
            <option value="">Sin definir</option>
            {DURACIONES.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} minutos` : m % 60 === 0 ? `${m / 60} ${m === 60 ? 'hora' : 'horas'}` : `${Math.floor(m / 60)} h ${m % 60} min`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="num-sesiones" className="text-sm font-medium text-text-1">Número de sesiones</label>
          <input
            id="num-sesiones"
            type="number"
            inputMode="numeric"
            min={1}
            max={52}
            placeholder="Ej: 4"
            value={sesiones}
            onChange={(e) => onSesionesChange(e.target.value)}
            className={control}
          />
        </div>
      </div>

      {total && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-lime px-3 py-1.5 text-sm text-lime-ink" aria-live="polite">
          <span className="font-display font-bold">{total}</span>
          {detalle && <span>{detalle}</span>}
        </p>
      )}
    </fieldset>
  );
}
