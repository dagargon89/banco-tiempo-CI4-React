// Tipos de dominio compartidos (doc 01, doc 03). Contratos de la API (doc 05).
export type EstadoVerificacion = 'no_verificado' | 'pendiente' | 'verificado' | 'rechazado';
export type Modalidad = 'presencial' | 'virtual';
export type EstadoVinculacion = 'solicitada' | 'aceptada' | 'rechazada' | 'completada' | 'cancelada';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  email_verificado: boolean;
  estado_verificacion: EstadoVerificacion;
  roles: string[];
}

export interface OfertaCard {
  id: number;
  titulo: string;
  descripcion_breve: string;
  modalidad: Modalidad;
  zona: string | null;
  categoria_id: number;
  oferente_id: number;
  oferente_nombre: string;
  oferente_foto: string | null;
  oferente_calif: number | null;
}

export interface ApiList<T> { data: T[]; meta: { total: number; page: number; per_page: number }; }
export interface ApiItem<T> { data: T; }
