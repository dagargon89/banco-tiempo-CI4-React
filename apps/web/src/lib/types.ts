// Tipos de dominio compartidos (doc 01, doc 03). Contratos de la API (doc 05).
export type EstadoVerificacion = 'no_verificado' | 'pendiente' | 'verificado' | 'rechazado';
export type Modalidad = 'presencial' | 'virtual';
export type EstadoVinculacion = 'solicitada' | 'aceptada' | 'rechazada' | 'completada' | 'cancelada';

export type TipoDocumento = 'ine' | 'pasaporte' | 'licencia' | 'otro';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  bio?: string;
  foto_perfil?: string | null;
  zona?: string | null;
  email_verificado: boolean;
  estado_verificacion: EstadoVerificacion;
  estado_cuenta?: string;
  roles: string[];
  created_at?: string;
}

export interface VerificacionPendiente {
  id: number;
  user_id: number;
  ruta_cifrada: string;
  tipo_documento: TipoDocumento;
  estado: string;
  nombre: string;
  email: string;
  foto_perfil: string | null;
  created_at: string;
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

export type EstadoOferta = 'borrador' | 'activa' | 'pausada' | 'eliminada';
export type TipoCapacidad = 'individual' | 'grupal';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  activa: number | boolean;
}

export interface OfertaImagen {
  id: number;
  ruta: string;
  orden: number;
}

export interface OfertaDetalle extends OfertaCard {
  descripcion_completa: string | null;
  tipo_capacidad: TipoCapacidad | null;
  capacidad_maxima: number | null;
  disponibilidad: string | null;
  estado: EstadoOferta;
  user_id: number;
  imagenes: OfertaImagen[];
  created_at: string;
}

export interface OfertaFormData {
  titulo: string;
  categoria_id: number;
  descripcion_breve: string;
  descripcion_completa?: string;
  modalidad: Modalidad;
  zona?: string;
  tipo_capacidad?: TipoCapacidad;
  capacidad_maxima?: number;
  disponibilidad?: string[];
}

export interface ApiList<T> { data: T[]; meta: { total: number; page: number; per_page: number }; }
export interface ApiItem<T> { data: T; }
