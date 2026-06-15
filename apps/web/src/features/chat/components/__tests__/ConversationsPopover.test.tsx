import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import ConversationsPopover from '../ConversationsPopover';
import { useBubbleStore } from '@/stores/bubbleStore';

const mockUseListarVinculaciones = vi.fn();

vi.mock('@/features/vinculaciones/hooks/useVinculaciones', () => ({
  useListarVinculaciones: (params: any) => mockUseListarVinculaciones(params),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: any) => selector({ user: { id: 1, nombre: 'Yo' } }),
}));

const VINCULACION = {
  id: 5,
  estado: 'aceptada',
  buscador_id: 1,
  buscador_nombre: 'Yo',
  buscador_foto: null,
  oferente_id: 2,
  oferente_nombre: 'Ana',
  oferente_foto: null,
  oferta_id: 10,
  oferta_titulo: 'Guitarra',
  confirmado_oferente: false,
  confirmado_buscador: false,
  created_at: '2026-06-12',
};

function renderPopover(open = true) {
  return render(
    <MemoryRouter>
      <ConversationsPopover open={open} onClose={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('ConversationsPopover', () => {
  beforeEach(() => {
    useBubbleStore.getState().cerrar();
    mockUseListarVinculaciones.mockReset();
  });

  it('no renderiza nada cuando open=false', () => {
    mockUseListarVinculaciones.mockReturnValue({ data: { data: [] }, isLoading: false });
    const { container } = renderPopover(false);
    expect(container.firstChild).toBeNull();
  });

  it('muestra loading mientras carga', () => {
    mockUseListarVinculaciones.mockReturnValue({ data: undefined, isLoading: true });
    renderPopover();
    expect(screen.getByRole('status', { name: /cargando/i })).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay vinculaciones', () => {
    mockUseListarVinculaciones.mockReturnValue({ data: { data: [] }, isLoading: false });
    renderPopover();
    expect(screen.getByText(/sin conversaciones/i)).toBeInTheDocument();
  });

  it('renderiza items combinando aceptadas y completadas', () => {
    mockUseListarVinculaciones.mockImplementation(({ estado }: { estado: string }) => ({
      data: { data: estado === 'aceptada' ? [VINCULACION] : [{ ...VINCULACION, id: 6, oferta_titulo: 'Cocina' }] },
      isLoading: false,
    }));
    renderPopover();
    expect(screen.getByText('Guitarra')).toBeInTheDocument();
    expect(screen.getByText('Cocina')).toBeInTheDocument();
  });

  it('click en item abre burbuja y llama onClose', () => {
    mockUseListarVinculaciones.mockImplementation(({ estado }: { estado: string }) => ({
      data: { data: estado === 'aceptada' ? [VINCULACION] : [] },
      isLoading: false,
    }));
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <ConversationsPopover open onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ana/i }));
    expect(useBubbleStore.getState().estado).toBe('abierta');
    expect(useBubbleStore.getState().vinculacionId).toBe(5);
    expect(useBubbleStore.getState().contraparte?.nombre).toBe('Ana');
    expect(onClose).toHaveBeenCalled();
  });

  it('link "Ver todos" apunta a /mensajes', () => {
    mockUseListarVinculaciones.mockReturnValue({ data: { data: [VINCULACION] }, isLoading: false });
    renderPopover();
    const link = screen.getByRole('link', { name: /ver todos/i });
    expect(link).toHaveAttribute('href', '/mensajes');
  });
});
