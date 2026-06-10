import { type FormEvent, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SocialButtons from '@/components/auth/SocialButtons';

export default function LoginPage() {
  const { user, loading, error, loginEmail, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    const dest = user.estado_verificacion === 'verificado' ? '/inicio' : '/perfil';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearError();
    loginEmail(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-accent">Banco de Tiempo</h1>
          <p className="mt-2 text-sm text-text-2">Participa Juárez · Intercambia habilidades con tu comunidad</p>
        </div>

        {/* Card */}
        <div className="rounded-md border border-border bg-surface p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-text-1">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 rounded-sm border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-3">o continúa con</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <SocialButtons />

          <p className="mt-6 text-center text-sm text-text-2">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-accent hover:text-accent-hover">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
