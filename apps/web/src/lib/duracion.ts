/**
 * Formato de la duración de una oferta. La API guarda minutos por sesión y
 * número de sesiones; ambos son opcionales.
 */

type Num = number | string | null | undefined;

function aEntero(v: Num): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** "45 min", "1 h", "1 h 30 min". */
export function formatoMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

const FRACCION: Record<number, string> = { 15: '¼', 30: '½', 45: '¾' };

/** Versión corta para el talón: "45 min", "4 h", "2¼ h", "1½ h". */
export function formatoCompacto(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  if (resto === 0) return `${h} h`;
  const frac = FRACCION[resto];
  return frac ? `${h}${frac} h` : formatoMinutos(min);
}

export interface Duracion {
  /** Lo que va grande en el talón: "4 h", "45 min" o null si no hay datos. */
  total: string | null;
  /** Explicación corta: "4 sesiones de 1 h", "Una sesión de 90 min". */
  detalle: string | null;
}

export function describirDuracion(duracionSesionMin: Num, numSesiones: Num): Duracion {
  const dur = aEntero(duracionSesionMin);
  const n = aEntero(numSesiones);

  if (dur && n) {
    const sesiones = n === 1 ? 'Una sesión' : `${n} sesiones`;
    return { total: formatoCompacto(dur * n), detalle: `${sesiones} de ${formatoMinutos(dur)}` };
  }
  if (dur) return { total: formatoCompacto(dur), detalle: 'Por sesión' };
  if (n) return { total: n === 1 ? '1 sesión' : `${n} sesiones`, detalle: 'Duración por acordar' };
  return { total: null, detalle: null };
}
