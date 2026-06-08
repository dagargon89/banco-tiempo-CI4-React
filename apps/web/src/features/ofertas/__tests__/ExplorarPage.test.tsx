import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ExplorarPage from '../ExplorarPage';

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: 1, nombre: 'Test', estado_verificacion: 'verificado', roles: [] },
      logout: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock the hooks
const mockUseExplorarOfertas = vi.fn();
vi.mock('../hooks/useOfertas', () => ({
  useExplorarOfertas: (...args: unknown[]) => mockUseExplorarOfertas(...args),
}));

vi.mock('../hooks/useCategorias', () => ({
  useCategorias: () => ({ data: [{ id: 1, nombre: 'Arte', slug: 'arte', activa: 1 }] }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExplorarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ExplorarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner mientras carga', () => {
    mockUseExplorarOfertas.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it('renderiza cards cuando hay datos', () => {
    mockUseExplorarOfertas.mockReturnValue({
      data: {
        data: [
          { id: 1, titulo: 'Clases de guitarra', descripcion_breve: 'Aprende a tocar la guitarra conmigo', modalidad: 'presencial', zona: 'Centro', categoria_id: 1, oferente_id: 1, oferente_nombre: 'Juan', oferente_foto: null, oferente_calif: null },
        ],
        meta: { total: 1, page: 1, per_page: 12 },
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('Clases de guitarra')).toBeDefined();
  });

  it('muestra empty state sin resultados', () => {
    mockUseExplorarOfertas.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, per_page: 12 } },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('No se encontraron ofertas')).toBeDefined();
  });
});
