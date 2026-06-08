import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: 1, nombre: 'Test User', email: 'test@test.com', estado_verificacion: 'no_verificado', roles: [] },
      logout: vi.fn(),
      refreshUser: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/lib/encryption', () => ({
  encryptDocument: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
}));

vi.mock('@/lib/storage', () => ({
  uploadEncryptedToStorage: vi.fn().mockResolvedValue(undefined),
}));

import DocumentUploadPage from '../DocumentUploadPage';

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

describe('DocumentUploadPage', () => {
  it('muestra los tipos de documento en el paso inicial', () => {
    renderWithProviders(<DocumentUploadPage />);

    expect(screen.getByText('Verificación de identidad')).toBeInTheDocument();
    expect(screen.getByText('INE / IFE')).toBeInTheDocument();
    expect(screen.getByText('Pasaporte')).toBeInTheDocument();
    expect(screen.getByText('Licencia de conducir')).toBeInTheDocument();
    expect(screen.getByText('Otro documento oficial')).toBeInTheDocument();
  });

  it('avanza al paso de selección de archivo al elegir tipo', () => {
    renderWithProviders(<DocumentUploadPage />);

    fireEvent.click(screen.getByText('INE / IFE'));
    expect(screen.getByText('Haz clic para seleccionar archivo')).toBeInTheDocument();
  });

  it('puede volver al paso anterior', () => {
    renderWithProviders(<DocumentUploadPage />);

    fireEvent.click(screen.getByText('INE / IFE'));
    fireEvent.click(screen.getByText('Atrás'));
    expect(screen.getByText('Selecciona el tipo de documento:')).toBeInTheDocument();
  });
});
