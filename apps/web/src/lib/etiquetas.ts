/**
 * Nombres legibles de los valores que guarda la API. La interfaz nunca debe
 * mostrar el valor crudo ("no_verificado", "en_proceso").
 */

export const ESTADO_OFERTA: Record<string, string> = {
  activa: 'Publicada',
  pausada: 'Pausada',
  borrador: 'Borrador',
  eliminada: 'Eliminada',
};

export const MODALIDAD: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
};

export const TIPO_TICKET: Record<string, string> = {
  reporte: 'Reporte',
  sugerencia: 'Sugerencia',
};

export const ESTADO_TICKET: Record<string, string> = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

export const ESTADO_VINCULACION: Record<string, string> = {
  solicitada: 'Solicitada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

/** Devuelve la etiqueta o, si falta, el valor con mayúscula inicial y sin guiones bajos. */
export function etiqueta(mapa: Record<string, string>, valor: string | null | undefined): string {
  if (!valor) return '';
  if (mapa[valor]) return mapa[valor];
  const limpio = valor.replace(/_/g, ' ');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
