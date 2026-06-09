import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CrearOfertaPage from '../CrearOfertaPage';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: 1, nombre: 'Test', estado_verificacion: 'verificado', roles: [], foto_perfil: null },
      logout: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../hooks/useCategorias', () => ({
  useCategorias: () => ({
    data: [
      { id: 1, nombre: 'Arte', slug: 'arte', activa: 1 },
      { id: 2, nombre: 'Musica', slug: 'musica', activa: 1 },
    ],
  }),
}));

vi.mock('../hooks/useOfertas', () => ({
  useCrearOferta: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../components/OfertaCardComponent', () => ({
  default: () => <div data-testid="oferta-card-preview" />,
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CrearOfertaPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CrearOfertaPage', () => {
  it('renderiza el paso 1 del wizard con campos de descripcion', () => {
    renderPage();
    expect(screen.getByText(/Paso 1 de 3/)).toBeDefined();
    expect(screen.getByLabelText('Titulo')).toBeDefined();
    expect(screen.getByText('Categoria')).toBeDefined();
    expect(screen.getByText(/Descripcion breve/)).toBeDefined();
    expect(screen.getByText('Siguiente')).toBeDefined();
  });

  it('muestra progress bar con 3 pasos', () => {
    renderPage();
    expect(screen.getByText('Descripcion')).toBeDefined();
    expect(screen.getByText('Detalles')).toBeDefined();
    expect(screen.getByText('Publicar')).toBeDefined();
  });
});
