import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <h1 className="font-display text-lg font-bold text-accent">Banco de Tiempo</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-2">{user.nombre}</span>
            <Button variant="subtle" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-md border border-border bg-surface p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-text-1">
            Bienvenido, {user.nombre}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard label="Correo" value={user.email} />
            <InfoCard label="Email verificado" value={user.email_verificado ? 'Sí' : 'No'} />
            <InfoCard label="Verificación de identidad" value={estadoLabel(user.estado_verificacion)} />
            <InfoCard label="Roles" value={user.roles.length > 0 ? user.roles.join(', ') : 'Usuario'} />
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface-2 p-4">
      <p className="text-xs font-medium text-text-3">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-1">{value}</p>
    </div>
  );
}

function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    no_verificado: 'No verificado',
    pendiente: 'Pendiente',
    verificado: 'Verificado',
    rechazado: 'Rechazado',
  };
  return map[estado] ?? estado;
}
