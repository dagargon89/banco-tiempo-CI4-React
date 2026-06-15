import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ChatBubble from '../ChatBubble';
import { useBubbleStore } from '@/stores/bubbleStore';

vi.mock('../ChatWindow', () => ({
  default: ({ vinculacionId }: { vinculacionId: number }) => (
    <div data-testid="chat-window">window-{vinculacionId}</div>
  ),
}));

describe('ChatBubble', () => {
  beforeEach(() => {
    useBubbleStore.getState().cerrar();
  });

  it('renderiza null cuando estado es cerrada', () => {
    const { container } = render(<ChatBubble />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza shell minimizado y NO renderiza ChatWindow cuando minimizada', () => {
    useBubbleStore.getState().abrir({
      vinculacionId: 1,
      contraparte: { id: 2, nombre: 'Ana', foto: null },
      ofertaTitulo: 'Test',
    });
    useBubbleStore.getState().minimizar();
    render(<ChatBubble />);
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('renderiza ChatWindow con vinculacionId cuando abierta', () => {
    useBubbleStore.getState().abrir({
      vinculacionId: 42,
      contraparte: { id: 2, nombre: 'Ana', foto: null },
      ofertaTitulo: 'Test',
    });
    render(<ChatBubble />);
    expect(screen.getByTestId('chat-window')).toHaveTextContent('window-42');
  });

  it('botón cerrar invoca cerrar() del store', () => {
    useBubbleStore.getState().abrir({
      vinculacionId: 42,
      contraparte: { id: 2, nombre: 'Ana', foto: null },
      ofertaTitulo: 'Test',
    });
    render(<ChatBubble />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar chat/i }));
    expect(useBubbleStore.getState().estado).toBe('cerrada');
  });

  it('botón minimizar invoca minimizar() del store', () => {
    useBubbleStore.getState().abrir({
      vinculacionId: 42,
      contraparte: { id: 2, nombre: 'Ana', foto: null },
      ofertaTitulo: 'Test',
    });
    render(<ChatBubble />);
    fireEvent.click(screen.getByRole('button', { name: /minimizar chat/i }));
    expect(useBubbleStore.getState().estado).toBe('minimizada');
  });

  it('header minimizado restaura al hacer click', () => {
    useBubbleStore.getState().abrir({
      vinculacionId: 42,
      contraparte: { id: 2, nombre: 'Ana', foto: null },
      ofertaTitulo: 'Test',
    });
    useBubbleStore.getState().minimizar();
    render(<ChatBubble />);
    fireEvent.click(screen.getByRole('button', { name: /restaurar chat/i }));
    expect(useBubbleStore.getState().estado).toBe('abierta');
  });
});
