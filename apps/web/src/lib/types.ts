// Tipos de dominio compartidos (doc 01, doc 03). Contratos de la API (doc 05).
export type EstadoVerificacion = 'no_verificado' | 'pendiente' | 'verificado' | 'rechazado';
export type Modalidad = 'presencial' | 'virtual';
export type EstadoVinculacion = 'solicitada' | 'aceptada' | 'rechazada' | 'completada' | 'cancelada';

export type TipoDocumento = 'ine' | 'pasaporte' | 'licencia' | 'otro';
export type Genero = 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';

export type ModalidadPreferida = 'presencial' | 'virtual' | 'hibrido';
export type FranjaHoraria = 'manana' | 'tarde' | 'noche' | 'fin_semana';
export type DiaSemana = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
export type Frecuencia = 'puntual' | 'mensual' | 'quincenal' | 'semanal';
export type AniosEnJuarez = 'menos_1' | '1_5' | '5_10' | 'mas_10';
export type ContactoPreferido = 'plataforma' | 'email' | 'whatsapp';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  bio?: string;
  foto_perfil?: string | null;
  zona?: string | null;
  fecha_nacimiento?: string | null;
  genero?: Genero | null;
  telefono?: string | null;

  // Grupo A — matchmaking
  modalidades_preferidas?: ModalidadPreferida[] | null;
  habilidades_enseno?: string[] | null;
  quiere_aprender?: string[] | null;

  // Grupo B — disponibilidad
  franjas_horarias?: FranjaHoraria[] | null;
  dias_disponibles?: DiaSemana[] | null;
  frecuencia?: Frecuencia | null;

  // Grupo C+E — identidad / trayectoria
  pronombres?: string | null;
  idiomas?: string[] | null;
  causas?: string[] | null;
  anios_en_juarez?: AniosEnJuarez | null;
  ocupacion_general?: string | null;

  // Grupo D — privacidad
  mostrar_edad?: boolean;
  mostrar_zona?: boolean;
  mostrar_habilidades?: boolean;
  permitir_contacto_directo?: boolean;
  contacto_preferido?: ContactoPreferido;

  email_verificado: boolean;
  estado_verificacion: EstadoVerificacion;
  estado_cuenta?: string;
  roles: string[];
  created_at?: string;
  deleted_at?: string | null;
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
  fecha_nacimiento: string | null;
  genero: Genero | null;
  telefono: string | null;
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
  oferente_inactivo?: boolean | number;
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
  pausada_por_admin?: number; // 0 | 1 from MySQL
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

export interface VinculacionCard {
  id: number;
  estado: EstadoVinculacion;
  buscador_id: number;
  buscador_nombre: string;
  buscador_foto: string | null;
  oferente_id: number;
  oferente_nombre: string;
  oferente_foto: string | null;
  oferta_id: number;
  oferta_titulo: string;
  confirmado_oferente: boolean;
  confirmado_buscador: boolean;
  cancelada_por?: number;
  aceptada_at?: string;
  completada_at?: string;
  created_at: string;
  oferente_inactivo?: boolean | number;
  buscador_inactivo?: boolean | number;
}

export interface ChatTokenResponse {
  firebase_custom_token: string;
  conversation_id: string;
  expires_in: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender_id: number;
  sender_uid: string;
  sender_name: string;
  created_at: any; // Firestore Timestamp
}

export interface Resena {
  id: number;
  vinculacion_id: number;
  autor_id: number;
  calificacion: number;
  comentario: string | null;
  created_at: string;
  autor_nombre: string;
  autor_foto: string | null;
  oferta_titulo: string;
  autor_inactivo?: boolean | number;
  destino_inactivo?: boolean | number;
}

export interface ResenaEstadisticas {
  promedio: number;
  total: number;
}

// Sprint 6: Tickets, Admin Usuarios, Métricas
export type TipoTicket = 'reporte' | 'sugerencia';
export type EntidadTipoTicket = 'usuario' | 'oferta' | 'mensaje' | 'resena' | 'otro';
export type EstadoTicket = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';
export type EstadoCuenta = 'activa' | 'suspendida' | 'baja';

export interface Ticket {
  id: number;
  folio: string;
  creador_id: number;
  creador_nombre?: string;
  tipo: TipoTicket;
  entidad_tipo: EntidadTipoTicket;
  entidad_id: number | null;
  estado: EstadoTicket;
  descripcion: string;
  resolucion: string | null;
  asignado_a_nombre?: string;
  created_at: string;
  updated_at: string;
  creador_inactivo?: boolean | number;
}

export interface AdminUsuario {
  id: number;
  nombre: string;
  email: string;
  foto_perfil: string | null;
  estado_verificacion: EstadoVerificacion;
  estado_cuenta: EstadoCuenta;
  zona: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface AdminUsuarioDetalle extends AdminUsuario {
  bio: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  foto_perfil: string | null;
  counts: {
    ofertas_activas: number;
    ofertas_pausadas_por_admin: number;
    vinculaciones_completadas: number;
    resenas_recibidas: number;
  };
  baja: null | {
    fecha: string;
    motivo: string | null;
    dado_baja_por: { id: number; nombre: string } | null;
  };
}

export interface Metricas {
  usuarios: { registrados: number; verificados: number };
  registros_por_periodo: { periodo: string; total: number }[];
  ofertas_activas_por_categoria: { categoria: string; total: number }[];
  vinculaciones_por_estado: Record<string, number>;
  tasa_aceptacion_por_categoria: { categoria: string; total: number; aceptadas: number }[];
  calificacion_promedio_plataforma: number;
  reportes: { total_recibidos: number; horas_promedio_resolucion: number };
  actividad_por_zona: { zona: string; ofertas: number; vinculaciones: number }[];
}

export interface ApiList<T> { data: T[]; meta: { total: number; page: number; per_page: number }; }
export interface ApiItem<T> { data: T; }
