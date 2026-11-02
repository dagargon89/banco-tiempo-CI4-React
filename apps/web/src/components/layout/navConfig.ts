import {
  Compass, BookOpen, GraduationCap, MessageCircle, User, LifeBuoy, BadgeCheck,
  ShieldCheck, Package, Users, Ticket, BarChart3, FolderOpen, UserCog,
} from 'lucide-react';
import type { ElementType } from 'react';

/**
 * Única fuente de la navegación del panel. El menú lateral, el cajón móvil,
 * la barra inferior y la barra superior leen de aquí, así nunca muestran
 * opciones distintas para la misma persona.
 *
 * Una misma persona aprende y enseña a la vez: no hay "modos". Lo que pidió
 * vive en Aprendiendo y lo que ofrece vive en Enseñando.
 */

export type NavItem = {
  to: string;
  label: string;
  icon: ElementType;
  end?: boolean;
  roles?: string[];
  /** Rutas extra que también marcan este elemento como activo. */
  match?: RegExp;
};

export type NavGroup = { label?: string; items: NavItem[] };

export const ADMIN_ROLES = ['moderador', 'soporte', 'verificador', 'analista', 'editor_categorias', 'super_admin'];

export const principal: NavItem[] = [
  { to: '/inicio', label: 'Explorar', icon: Compass, end: true, match: /^\/ofertas\/\d+$/ },
  { to: '/aprendiendo', label: 'Aprendiendo', icon: BookOpen },
  { to: '/ensenando', label: 'Enseñando', icon: GraduationCap, match: /^\/ofertas\/(nueva|\d+\/editar)$/ },
  { to: '/mensajes', label: 'Mensajes', icon: MessageCircle },
];

export const cuenta: NavItem[] = [
  { to: '/perfil', label: 'Mi perfil', icon: User, match: /^\/(perfil|verificacion)/ },
  { to: '/mis-tickets', label: 'Soporte', icon: LifeBuoy, match: /^\/tickets/ },
];

export const pendiente: NavItem[] = [
  { to: '/perfil', label: 'Mi perfil', icon: User, end: true },
  { to: '/verificacion', label: 'Verificar mi identidad', icon: BadgeCheck },
];

export const admin: NavItem[] = [
  { to: '/admin/verificaciones', label: 'Verificaciones', icon: ShieldCheck, roles: ['moderador', 'verificador'] },
  { to: '/admin/ofertas', label: 'Ofertas', icon: Package, roles: ['moderador'] },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['moderador'] },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket, roles: ['moderador', 'soporte'] },
  { to: '/admin/metricas', label: 'Métricas', icon: BarChart3, roles: ['moderador', 'analista'] },
  { to: '/admin/categorias', label: 'Categorías', icon: FolderOpen, roles: ['editor_categorias'] },
  { to: '/admin/moderadores', label: 'Moderadores', icon: UserCog, roles: ['super_admin'] },
];

export function filtrarPorRoles(items: NavItem[], roles: string[]): NavItem[] {
  const superAdmin = roles.includes('super_admin');
  return items.filter((i) => !i.roles?.length || superAdmin || i.roles.some((r) => roles.includes(r)));
}

export function esAdmin(roles: string[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

/** Primera ruta de administración a la que la persona tiene acceso. */
export function inicioAdmin(roles: string[]): string {
  return filtrarPorRoles(admin, roles)[0]?.to ?? '/admin/usuarios';
}

/** Grupos del menú según el área (panel o administración) y la verificación. */
export function gruposDeNavegacion(pathname: string, roles: string[], verificado: boolean): NavGroup[] {
  if (pathname.startsWith('/admin')) {
    return [{ label: 'Administración', items: filtrarPorRoles(admin, roles) }];
  }
  if (!verificado) return [{ items: pendiente }];
  return [{ items: principal }, { label: 'Tu cuenta', items: cuenta }];
}

export function estaActivo(item: NavItem, pathname: string): boolean {
  if (item.match?.test(pathname)) return true;
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** Título de la página actual para la barra superior. */
export function tituloDeRuta(pathname: string): string {
  const todos = [...principal, ...cuenta, ...pendiente, ...admin];
  if (/^\/vinculaciones\/\d+$/.test(pathname)) return 'Intercambio';
  if (pathname === '/ofertas/nueva') return 'Nueva oferta';
  if (/^\/ofertas\/\d+\/editar$/.test(pathname)) return 'Editar oferta';
  if (/^\/ofertas\/\d+$/.test(pathname)) return 'Oferta';
  if (pathname === '/perfil/editar') return 'Editar perfil';
  if (pathname === '/tickets/crear') return 'Nuevo ticket';
  if (pathname === '/privacidad') return 'Aviso de privacidad';
  return todos.find((i) => estaActivo({ ...i, match: undefined }, pathname))?.label ?? 'Banco de Tiempo';
}
