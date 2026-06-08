import { type FormEvent, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SocialButtons from '@/components/auth/SocialButtons';

export default function RegisterPage() {
  const { user, loading, error, register, clearError } = useAuthStore();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    register(email, password, nombre);
  };

  const displayError = localError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-accent">Banco de Tiempo</h1>
          <p className="mt-2 text-sm text-text-2">Participa Juárez · Únete a la comunidad</p>
        </div>

        {/* Card */}
        <div className="rounded-md border border-border bg-surface p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-text-1">Crear cuenta</h2>

          {displayError && (
            <div className="mb-4 rounded-sm border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              required
              autoComplete="name"
            />
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
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              autoComplete="new-password"
            />
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-3">o regístrate con</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <SocialButtons />

          <p className="mt-6 text-center text-sm text-text-2">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
