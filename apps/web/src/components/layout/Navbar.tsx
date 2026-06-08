import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const esVerificado = user?.estado_verificacion === 'verificado';

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-lg font-bold text-accent">
            Banco de Tiempo
          </Link>
          {user && esVerificado && (
            <div className="hidden items-center gap-4 sm:flex">
              <Link to="/" className="text-sm text-text-2 hover:text-accent">Explorar</Link>
              <Link to="/mis-ofertas" className="text-sm text-text-2 hover:text-accent">Mis Ofertas</Link>
              <Link to="/ofertas/nueva" className="text-sm text-text-2 hover:text-accent">Nueva Oferta</Link>
            </div>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Link to="/perfil" className="flex items-center gap-2 hover:opacity-80">
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="sm" />
              <span className="hidden text-sm text-text-2 sm:inline">{user.nombre}</span>
            </Link>
            <Button variant="subtle" onClick={logout}>
              Cerrar sesion
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
