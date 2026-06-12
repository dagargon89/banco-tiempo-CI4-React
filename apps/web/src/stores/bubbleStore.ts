import { create } from 'zustand';

export interface ContraparteMinima {
  id: number;
  nombre: string;
  foto: string | null;
}

interface AbrirPayload {
  vinculacionId: number;
  contraparte: ContraparteMinima;
  ofertaTitulo: string;
  otroInactivo?: boolean;
}

interface BubbleState {
  vinculacionId: number | null;
  contraparte: ContraparteMinima | null;
  ofertaTitulo: string | null;
  otroInactivo: boolean;
  estado: 'cerrada' | 'abierta' | 'minimizada';
  abrir: (payload: AbrirPayload) => void;
  minimizar: () => void;
  restaurar: () => void;
  cerrar: () => void;
}

const ESTADO_INICIAL = {
  vinculacionId: null,
  contraparte: null,
  ofertaTitulo: null,
  otroInactivo: false,
  estado: 'cerrada' as const,
};

export const useBubbleStore = create<BubbleState>((set) => ({
  ...ESTADO_INICIAL,
  abrir: ({ vinculacionId, contraparte, ofertaTitulo, otroInactivo = false }) =>
    set({ vinculacionId, contraparte, ofertaTitulo, otroInactivo, estado: 'abierta' }),
  minimizar: () => set({ estado: 'minimizada' }),
  restaurar: () => set({ estado: 'abierta' }),
  cerrar: () => set(ESTADO_INICIAL),
}));
