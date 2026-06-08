import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import RegisterPage from '../RegisterPage';

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, initialized: true, error: null });
  });

  it('renderiza el formulario de registro', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu nombre completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@correo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repite tu contraseña')).toBeInTheDocument();
  });

  it('tiene enlace a login', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText('Inicia sesión')).toBeInTheDocument();
  });

  it('muestra error si contraseñas no coinciden', async () => {
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText('Tu nombre completo'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
  });

  it('muestra error si contraseña es muy corta', async () => {
    renderWithProviders(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText('Tu nombre completo'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Repite tu contraseña'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument();
  });
});
