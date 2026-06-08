import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="font-display text-lg font-bold text-accent">
          Banco de Tiempo
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <Link to="/perfil" className="flex items-center gap-2 hover:opacity-80">
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="sm" />
              <span className="hidden text-sm text-text-2 sm:inline">{user.nombre}</span>
            </Link>
            <Button variant="subtle" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
