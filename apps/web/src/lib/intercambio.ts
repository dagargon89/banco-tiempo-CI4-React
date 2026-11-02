import type { EstadoVinculacion, VinculacionCard } from './types';

/**
 * En la interfaz una "vinculación" se llama intercambio, y su estado se dice
 * desde el lado de quien la mira: lo que para quien pide es "Esperando
 * respuesta", para quien enseña es "Por responder".
 */

export type Papel = 'aprendiendo' | 'ensenando';

export function papelEn(v: VinculacionCard, userId: number): Papel {
  return Number(v.oferente_id) === Number(userId) ? 'ensenando' : 'aprendiendo';
}

const ESTADO: Record<Papel, Record<EstadoVinculacion, string>> = {
  aprendiendo: {
    solicitada: 'Esperando respuesta',
    aceptada: 'En curso',
    completada: 'Terminado',
    rechazada: 'No aceptado',
    cancelada: 'Cancelado',
  },
  ensenando: {
    solicitada: 'Por responder',
    aceptada: 'En curso',
    completada: 'Terminado',
    rechazada: 'Rechazado',
    cancelada: 'Cancelado',
  },
};

export function etiquetaEstado(estado: EstadoVinculacion, papel: Papel): string {
  return ESTADO[papel][estado] ?? estado;
}

export type Tono = 'accion' | 'activo' | 'neutro' | 'cerrado';

/** El tono resalta solo lo que pide algo de la persona. */
export function tonoEstado(estado: EstadoVinculacion, papel: Papel): Tono {
  if (estado === 'solicitada') return papel === 'ensenando' ? 'accion' : 'neutro';
  if (estado === 'aceptada') return 'activo';
  if (estado === 'completada') return 'neutro';
  return 'cerrado';
}

export function contraparte(v: VinculacionCard, papel: Papel) {
  return papel === 'ensenando'
    ? { nombre: v.buscador_nombre, foto: v.buscador_foto, inactivo: v.buscador_inactivo }
    : { nombre: v.oferente_nombre, foto: v.oferente_foto, inactivo: v.oferente_inactivo };
}

export function faltaMiConfirmacion(v: VinculacionCard, papel: Papel): boolean {
  if (v.estado !== 'aceptada') return false;
  const mia = papel === 'ensenando' ? v.confirmado_oferente : v.confirmado_buscador;
  return !Number(mia);
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
