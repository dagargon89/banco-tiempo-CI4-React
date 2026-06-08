import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CrearOfertaPage from '../CrearOfertaPage';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: 1, nombre: 'Test', estado_verificacion: 'verificado', roles: [] },
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
  it('renderiza el formulario con todos los campos', () => {
    renderPage();
    expect(screen.getByLabelText('Titulo')).toBeDefined();
    expect(screen.getByText('Categoria')).toBeDefined();
    expect(screen.getByText(/Descripcion breve/)).toBeDefined();
    expect(screen.getByText('Modalidad')).toBeDefined();
    expect(screen.getByText('Tipo de capacidad')).toBeDefined();
    expect(screen.getByText('Disponibilidad')).toBeDefined();
    expect(screen.getByText('Publicar oferta')).toBeDefined();
  });

  it('muestra campo zona cuando modalidad es presencial (por defecto)', () => {
    renderPage();
    expect(screen.getByLabelText('Zona')).toBeDefined();
  });
});
