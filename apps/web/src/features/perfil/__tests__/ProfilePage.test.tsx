import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('../hooks/useProfile', () => ({
  useProfile: vi.fn(),
  useVerificacionEstado: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: 1, nombre: 'Test User', email: 'test@test.com', estado_verificacion: 'no_verificado', roles: [] },
      logout: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

import ProfilePage from '../ProfilePage';
import { useProfile, useVerificacionEstado } from '../hooks/useProfile';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra skeleton mientras carga', () => {
    vi.mocked(useProfile).mockReturnValue({ data: undefined, isLoading: true } as any);
    vi.mocked(useVerificacionEstado).mockReturnValue({ data: undefined } as any);

    renderWithProviders(<ProfilePage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('muestra nombre del usuario cuando carga', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: {
        id: 1,
        nombre: 'Juan Pérez',
        email: 'juan@test.com',
        bio: 'Hola mundo',
        estado_verificacion: 'verificado',
        roles: [],
        created_at: '2026-05-01T00:00:00Z',
      },
      isLoading: false,
    } as any);
    vi.mocked(useVerificacionEstado).mockReturnValue({ data: { estado: 'verificado', motivo_rechazo: null } } as any);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
  });

  it('muestra banner de verificación si no verificado', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: {
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        estado_verificacion: 'no_verificado',
        roles: [],
      },
      isLoading: false,
    } as any);
    vi.mocked(useVerificacionEstado).mockReturnValue({ data: { estado: 'no_verificado', motivo_rechazo: null } } as any);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Completa tu verificación de identidad')).toBeInTheDocument();
  });
});
