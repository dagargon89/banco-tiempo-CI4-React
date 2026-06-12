import { describe, it, expect, beforeEach } from 'vitest';
import { useBubbleStore } from '../bubbleStore';

const PAYLOAD = {
  vinculacionId: 42,
  contraparte: { id: 7, nombre: 'Ana', foto: null },
  ofertaTitulo: 'Clases de guitarra',
};

describe('bubbleStore', () => {
  beforeEach(() => {
    useBubbleStore.getState().cerrar();
  });

  it('estado inicial es cerrada con valores null', () => {
    const s = useBubbleStore.getState();
    expect(s.estado).toBe('cerrada');
    expect(s.vinculacionId).toBeNull();
    expect(s.contraparte).toBeNull();
    expect(s.ofertaTitulo).toBeNull();
    expect(s.otroInactivo).toBe(false);
  });

  it('abrir() pone estado abierta y guarda payload', () => {
    useBubbleStore.getState().abrir(PAYLOAD);
    const s = useBubbleStore.getState();
    expect(s.estado).toBe('abierta');
    expect(s.vinculacionId).toBe(42);
    expect(s.contraparte).toEqual({ id: 7, nombre: 'Ana', foto: null });
    expect(s.ofertaTitulo).toBe('Clases de guitarra');
    expect(s.otroInactivo).toBe(false);
  });

  it('abrir() acepta otroInactivo opcional', () => {
    useBubbleStore.getState().abrir({ ...PAYLOAD, otroInactivo: true });
    expect(useBubbleStore.getState().otroInactivo).toBe(true);
  });

  it('abrir() segundo call reemplaza la conversación anterior', () => {
    useBubbleStore.getState().abrir(PAYLOAD);
    useBubbleStore.getState().abrir({
      vinculacionId: 99,
      contraparte: { id: 8, nombre: 'Luis', foto: 'x.jpg' },
      ofertaTitulo: 'Cocina mexicana',
    });
    const s = useBubbleStore.getState();
    expect(s.vinculacionId).toBe(99);
    expect(s.contraparte?.nombre).toBe('Luis');
    expect(s.estado).toBe('abierta');
  });

  it('minimizar() cambia estado a minimizada sin tocar payload', () => {
    useBubbleStore.getState().abrir(PAYLOAD);
    useBubbleStore.getState().minimizar();
    const s = useBubbleStore.getState();
    expect(s.estado).toBe('minimizada');
    expect(s.vinculacionId).toBe(42);
  });

  it('restaurar() regresa a abierta desde minimizada', () => {
    useBubbleStore.getState().abrir(PAYLOAD);
    useBubbleStore.getState().minimizar();
    useBubbleStore.getState().restaurar();
    expect(useBubbleStore.getState().estado).toBe('abierta');
  });

  it('cerrar() resetea todo al estado inicial', () => {
    useBubbleStore.getState().abrir(PAYLOAD);
    useBubbleStore.getState().cerrar();
    const s = useBubbleStore.getState();
    expect(s.estado).toBe('cerrada');
    expect(s.vinculacionId).toBeNull();
    expect(s.contraparte).toBeNull();
    expect(s.ofertaTitulo).toBeNull();
    expect(s.otroInactivo).toBe(false);
  });
});
