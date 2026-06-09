import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: { id: 1, nombre: 'Admin', estado_verificacion: 'verificado', roles: ['super_admin'] },
      logout: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

const mockUseMetricas = vi.fn();
vi.mock('../hooks/useAdminMetricas', () => ({
  useMetricas: () => mockUseMetricas(),
}));

import AdminMetricasPage from '../AdminMetricasPage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminMetricasPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminMetricasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra skeletons mientras carga', () => {
    mockUseMetricas.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    expect(document.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renderiza sin crash con datos', () => {
    mockUseMetricas.mockReturnValue({
      data: {
        usuarios: { registrados: 100, verificados: 42 },
        registros_por_periodo: [{ periodo: '2026-06', total: 10 }],
        ofertas_activas_por_categoria: [{ categoria: 'Arte', total: 5 }],
        vinculaciones_por_estado: { solicitada: 3, aceptada: 2, completada: 1 },
        tasa_aceptacion_por_categoria: [{ categoria: 'Arte', aceptadas: 2, total: 5 }],
        calificacion_promedio_plataforma: 4.5,
        reportes: { total_recibidos: 3, horas_promedio_resolucion: 12 },
        actividad_por_zona: [{ zona: 'Centro', ofertas: 5, vinculaciones: 3 }],
      },
      isLoading: false,
    });
    renderPage();
    expect(screen.getByText('Dashboard de metricas')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
