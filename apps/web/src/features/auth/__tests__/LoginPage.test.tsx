import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '../LoginPage';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, initialized: true, error: null });
  });

  it('renderiza el formulario de login', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu contraseña')).toBeInTheDocument();
  });

  it('tiene botón de submit', () => {
    renderWithProviders(<LoginPage />);
    // El botón puede decir "Iniciar sesión" o "Ingresando..." según el estado de loading
    expect(screen.getByRole('button', { name: /iniciar sesión|ingresando/i })).toBeInTheDocument();
  });

  it('tiene enlace a registro', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Regístrate')).toBeInTheDocument();
  });

  it('tiene botón de Google', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
  });

  it('muestra la marca Participa Juárez', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Banco de Tiempo')).toBeInTheDocument();
    expect(screen.getByText(/Participa Juárez/)).toBeInTheDocument();
  });
});
