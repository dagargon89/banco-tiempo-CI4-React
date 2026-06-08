import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Link2, MessageSquare, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
const linkActive = 'bg-accent/10 text-accent';
const linkInactive = 'text-text-2 hover:bg-surface-2 hover:text-text-1';

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();

  const isOferente = pathname.startsWith('/mis-ofertas') || pathname.startsWith('/panel');
  const isAdmin = pathname.startsWith('/admin');

  const sectionLabel = isAdmin ? 'ADMINISTRADOR' : isOferente ? 'OFERENTE' : 'BUSCADOR';

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
          <span className="text-sm font-bold text-white">BT</span>
        </div>
        <div>
          <p className="text-sm font-bold text-text-1">Banco de Tiempo</p>
          <p className="text-[10px] text-text-3">Plan Juarez</p>
        </div>
      </div>

      {/* Section label */}
      <p className="px-5 pb-2 pt-4 text-[10px] font-semibold tracking-wider text-text-3">
        {sectionLabel}
      </p>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {!isOferente && !isAdmin && (
          <>
            <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Home className="h-4 w-4" /> Inicio
            </NavLink>
            <NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive && pathname === '/' ? linkActive : linkInactive}`}>
              <Search className="h-4 w-4" /> Explorar
            </NavLink>
            <NavLink to="/vinculaciones" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Link2 className="h-4 w-4" /> Vinculaciones
            </NavLink>
            <NavLink to="/mensajes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <MessageSquare className="h-4 w-4" /> Mensajes
            </NavLink>
            <NavLink to="/perfil" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <User className="h-4 w-4" /> Mi perfil
            </NavLink>
          </>
        )}

        {isOferente && (
          <>
            <NavLink to="/" className={() => `${linkBase} ${linkInactive}`}>
              <Home className="h-4 w-4" /> Inicio
            </NavLink>
            <NavLink to="/mis-ofertas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Search className="h-4 w-4" /> Panel
            </NavLink>
            <NavLink to="/vinculaciones" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Link2 className="h-4 w-4" /> Vinculaciones
            </NavLink>
            <NavLink to="/mensajes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <MessageSquare className="h-4 w-4" /> Mensajes
            </NavLink>
            <NavLink to="/perfil" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <User className="h-4 w-4" /> Mi perfil
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <NavLink to="/" className={() => `${linkBase} ${linkInactive}`}>
              <Home className="h-4 w-4" /> Inicio
            </NavLink>
            <NavLink to="/admin/verificaciones" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Search className="h-4 w-4" /> Verificaciones
            </NavLink>
            <NavLink to="/admin/ofertas" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Link2 className="h-4 w-4" /> Ofertas
            </NavLink>
            <NavLink to="/perfil" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <User className="h-4 w-4" /> Mi perfil
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom hint */}
      {user && (
        <div className="mx-3 mb-4 rounded-lg bg-accent/5 p-3">
          <p className="text-xs font-semibold text-accent">Demo de presentacion</p>
          <p className="mt-1 text-[10px] text-text-3">
            Usa el conmutador de rol para recorrer las tres perspectivas.
          </p>
        </div>
      )}
    </aside>
  );
}
