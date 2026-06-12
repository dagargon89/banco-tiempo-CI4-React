# Chat tipo Messenger con burbujas flotantes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar burbuja flotante de chat única persistente cross-page, accesible desde un icono nuevo en `TopBar` con popover de conversaciones, sin tocar backend ni reglas de Firestore.

**Architecture:** Frontend-only. Nuevo `bubbleStore` Zustand para estado UI; nuevos componentes `ChatBubble` (shell flotante en layout root) y `ConversationsPopover` (lista que abre desde el icono del TopBar). `ChatWindow` existente se reutiliza con una prop `variant` aditiva. Coexiste con la página `/mensajes` y el chat embebido en `/vinculaciones/:id`.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5, TanStack Query 5, Tailwind 4, lucide-react, Vitest 2 + Testing Library 16.

**Spec:** `docs/superpowers/specs/2026-06-12-chat-burbujas-messenger-design.md`

---

## File Structure

**Nuevos:**
- `apps/web/src/stores/bubbleStore.ts` — estado UI de la burbuja
- `apps/web/src/stores/__tests__/bubbleStore.test.ts` — tests del store
- `apps/web/src/features/chat/components/ChatBubble.tsx` — shell flotante
- `apps/web/src/features/chat/components/ConversationsPopover.tsx` — lista en popover
- `apps/web/src/features/chat/components/__tests__/ChatBubble.test.tsx`
- `apps/web/src/features/chat/components/__tests__/ConversationsPopover.test.tsx`

**Modificados:**
- `apps/web/src/features/chat/components/ChatWindow.tsx` — prop `variant`
- `apps/web/src/components/layout/TopBar.tsx` — icono + popover
- `apps/web/src/app/App.tsx` — montar `<ChatBubble />` a nivel root
- `apps/web/src/stores/authStore.ts` — `logout()` cierra burbuja
- `apps/web/src/features/vinculaciones/VinculacionDetallePage.tsx` — botón "Abrir en burbuja"
- `apps/web/src/features/chat/MensajesPage.tsx` — botón "Chatear" sin navegar

---

## Task 1: bubbleStore (estado UI puro)

**Files:**
- Create: `apps/web/src/stores/bubbleStore.ts`
- Test: `apps/web/src/stores/__tests__/bubbleStore.test.ts`

- [ ] **Step 1: Escribir tests fallidos**

Crear `apps/web/src/stores/__tests__/bubbleStore.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr tests para verificar que fallan**

Run: `cd apps/web && npm test -- bubbleStore`
Expected: FAIL con error de módulo no encontrado (`Cannot find module '../bubbleStore'`).

- [ ] **Step 3: Implementar el store**

Crear `apps/web/src/stores/bubbleStore.ts`:

```ts
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
```

- [ ] **Step 4: Correr tests para verificar que pasan**

Run: `cd apps/web && npm test -- bubbleStore`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/bubbleStore.ts apps/web/src/stores/__tests__/bubbleStore.test.ts
git commit -m "feat(chat): bubbleStore para estado UI de burbuja flotante"
```

---

## Task 2: ChatWindow soporta variant="bubble"

**Files:**
- Modify: `apps/web/src/features/chat/components/ChatWindow.tsx`

Sin tests nuevos (cambio de presentación; cubierto manualmente al integrar en Task 3).

- [ ] **Step 1: Agregar prop `variant` al componente**

Modificar la interface `Props` y la firma del componente en `apps/web/src/features/chat/components/ChatWindow.tsx`:

```tsx
interface Props {
  vinculacionId: number;
  otroInactivo?: boolean;
  variant?: 'embedded' | 'bubble';
}

export default function ChatWindow({ vinculacionId, otroInactivo, variant = 'embedded' }: Props) {
```

- [ ] **Step 2: Ajustar el contenedor raíz según variant**

Reemplazar la línea `<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">` (aprox línea 74) por:

```tsx
<div
  className={
    variant === 'bubble'
      ? 'flex h-full flex-col overflow-hidden bg-surface'
      : 'flex flex-col overflow-hidden rounded-xl border border-border bg-surface'
  }
>
```

- [ ] **Step 3: Ocultar header interno en variant="bubble"**

Envolver el bloque del header interno (aprox líneas 76-85, el div con `border-b border-border bg-surface-2`) en una condicional:

```tsx
{variant !== 'bubble' && (
  <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
    <MessageCircle className="h-4 w-4 text-accent" />
    <h3 className="text-sm font-semibold text-text-1">Chat</h3>
    {isConnected && (
      <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
        <span className="h-2 w-2 rounded-full bg-success" />
        Conectado
      </span>
    )}
  </div>
)}
```

- [ ] **Step 4: Ajustar zona de mensajes para llenar altura en variant="bubble"**

Reemplazar `<div className="flex max-h-96 min-h-[200px] flex-col gap-2 overflow-y-auto p-4">` por:

```tsx
<div
  className={
    variant === 'bubble'
      ? 'flex flex-1 flex-col gap-2 overflow-y-auto p-4'
      : 'flex max-h-96 min-h-[200px] flex-col gap-2 overflow-y-auto p-4'
  }
>
```

- [ ] **Step 5: Verificar typecheck y que el chat embebido sigue funcionando**

Run: `cd apps/web && npm run typecheck`
Expected: sin errores.

Run manual: abrir `http://localhost:5173`, autenticarse, navegar a una vinculación con estado aceptada y verificar que el `ChatWindow` embebido se ve igual que antes (variant default `'embedded'`).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/chat/components/ChatWindow.tsx
git commit -m "feat(chat): ChatWindow acepta variant para uso en burbuja flotante"
```

---

## Task 3: ChatBubble (shell flotante)

**Files:**
- Create: `apps/web/src/features/chat/components/ChatBubble.tsx`
- Test: `apps/web/src/features/chat/components/__tests__/ChatBubble.test.tsx`

- [ ] **Step 1: Escribir tests fallidos**

Crear `apps/web/src/features/chat/components/__tests__/ChatBubble.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Correr tests para verificar que fallan**

Run: `cd apps/web && npm test -- ChatBubble`
Expected: FAIL con `Cannot find module '../ChatBubble'`.

- [ ] **Step 3: Implementar ChatBubble**

Crear `apps/web/src/features/chat/components/ChatBubble.tsx`:

```tsx
import { Minus, X, MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import ChatWindow from './ChatWindow';
import { useBubbleStore } from '@/stores/bubbleStore';

export default function ChatBubble() {
  const { estado, vinculacionId, contraparte, ofertaTitulo, otroInactivo, minimizar, restaurar, cerrar } =
    useBubbleStore();

  if (estado === 'cerrada' || vinculacionId === null || contraparte === null) {
    return null;
  }

  if (estado === 'minimizada') {
    return (
      <div
        className="fixed bottom-4 right-4 z-40 w-72 overflow-hidden rounded-full border border-border bg-surface shadow-lg"
        role="region"
        aria-label="Chat minimizado"
      >
        <button
          onClick={restaurar}
          aria-label="Restaurar chat"
          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2"
        >
          <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
            {ofertaTitulo && <p className="truncate text-xs text-text-3">{ofertaTitulo}</p>}
          </div>
          <MessageCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // estado === 'abierta'
  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg max-sm:inset-x-2 max-sm:bottom-2 max-sm:h-[70vh] max-sm:w-auto"
      role="dialog"
      aria-label={`Chat con ${contraparte.nombre}`}
    >
      <header className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
          {ofertaTitulo && <p className="truncate text-xs text-text-3">{ofertaTitulo}</p>}
        </div>
        <button
          onClick={minimizar}
          aria-label="Minimizar chat"
          className="rounded-md p-1 text-text-3 transition-colors hover:bg-surface hover:text-text-1"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={cerrar}
          aria-label="Cerrar chat"
          className="rounded-md p-1 text-text-3 transition-colors hover:bg-surface hover:text-error"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow vinculacionId={vinculacionId} otroInactivo={otroInactivo} variant="bubble" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Correr tests para verificar que pasan**

Run: `cd apps/web && npm test -- ChatBubble`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/chat/components/ChatBubble.tsx apps/web/src/features/chat/components/__tests__/ChatBubble.test.tsx
git commit -m "feat(chat): componente ChatBubble (shell flotante)"
```

---

## Task 4: ConversationsPopover (lista para el TopBar)

**Files:**
- Create: `apps/web/src/features/chat/components/ConversationsPopover.tsx`
- Test: `apps/web/src/features/chat/components/__tests__/ConversationsPopover.test.tsx`

- [ ] **Step 1: Escribir tests fallidos**

Crear `apps/web/src/features/chat/components/__tests__/ConversationsPopover.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Correr tests para verificar que fallan**

Run: `cd apps/web && npm test -- ConversationsPopover`
Expected: FAIL con `Cannot find module '../ConversationsPopover'`.

- [ ] **Step 3: Implementar ConversationsPopover**

Crear `apps/web/src/features/chat/components/ConversationsPopover.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from '@/features/vinculaciones/components/EstadoBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { useBubbleStore } from '@/stores/bubbleStore';
import type { VinculacionCard } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConversationsPopover({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const abrirBurbuja = useBubbleStore((s) => s.abrir);

  const { data: aceptadas, isLoading: loadingA } = useListarVinculaciones({ estado: 'aceptada', per_page: 50 });
  const { data: completadas, isLoading: loadingC } = useListarVinculaciones({ estado: 'completada', per_page: 50 });

  if (!open) return null;

  const isLoading = loadingA || loadingC;
  const vinculaciones: VinculacionCard[] = [
    ...(aceptadas?.data ?? []),
    ...(completadas?.data ?? []),
  ];

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 flex max-h-[480px] w-80 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
      role="menu"
      aria-label="Conversaciones"
    >
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-sm font-semibold text-text-1">Mensajes</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8" role="status" aria-label="Cargando">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : vinculaciones.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState
              icon={<MessageCircle className="h-8 w-8" />}
              title="Sin conversaciones"
              subtitle="Las conversaciones aparecen cuando una vinculación es aceptada"
            />
          </div>
        ) : (
          <ul>
            {vinculaciones.map((v) => {
              const contraparte =
                user?.id === v.buscador_id
                  ? { id: v.oferente_id, nombre: v.oferente_nombre, foto: v.oferente_foto }
                  : { id: v.buscador_id, nombre: v.buscador_nombre, foto: v.buscador_foto };
              const isInactivo = (val: unknown): boolean => val === true || val === 1 || val === '1';
              const otroInactivo = user?.id === v.buscador_id
                ? isInactivo(v.oferente_inactivo)
                : isInactivo(v.buscador_inactivo);

              return (
                <li key={v.id}>
                  <button
                    onClick={() => {
                      abrirBurbuja({
                        vinculacionId: v.id,
                        contraparte,
                        ofertaTitulo: v.oferta_titulo,
                        otroInactivo,
                      });
                      onClose();
                    }}
                    aria-label={contraparte.nombre}
                    className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
                      <p className="truncate text-xs text-text-3">{v.oferta_titulo}</p>
                    </div>
                    <EstadoBadge estado={v.estado} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border bg-surface-2 px-4 py-2 text-center">
        <Link
          to="/mensajes"
          onClick={onClose}
          className="text-xs font-medium text-accent hover:underline"
        >
          Ver todos los mensajes
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Correr tests para verificar que pasan**

Run: `cd apps/web && npm test -- ConversationsPopover`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/chat/components/ConversationsPopover.tsx apps/web/src/features/chat/components/__tests__/ConversationsPopover.test.tsx
git commit -m "feat(chat): ConversationsPopover para acceso desde TopBar"
```

---

## Task 5: Icono y popover en TopBar

**Files:**
- Modify: `apps/web/src/components/layout/TopBar.tsx`

Sin tests automatizados nuevos (QA manual). Cambio aditivo en la barra; el resto del componente queda intacto.

- [ ] **Step 1: Importar MessageCircle, useRef adicional y ConversationsPopover**

En la línea 3 de `apps/web/src/components/layout/TopBar.tsx`, agregar `MessageCircle` al import de `lucide-react`:

```tsx
import { Menu, Search, Plus, Shield, Bell, ChevronRight, LogOut, User, MessageCircle } from 'lucide-react';
```

Después de los imports existentes (después de la línea 6), agregar:

```tsx
import ConversationsPopover from '@/features/chat/components/ConversationsPopover';
```

- [ ] **Step 2: Agregar estado y ref para el popover de mensajes**

Después de la línea `const [menuOpen, setMenuOpen] = useState(false);` (línea 67), agregar:

```tsx
const [mensajesOpen, setMensajesOpen] = useState(false);
const mensajesRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 3: Extender el click-outside del useEffect existente**

Reemplazar el bloque `useEffect` que maneja `handleClickOutside` (líneas 70-76) por:

```tsx
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    const target = e.target as Node;
    if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
    if (mensajesRef.current && !mensajesRef.current.contains(target)) setMensajesOpen(false);
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

- [ ] **Step 4: Cerrar popover al cambiar de ruta**

Reemplazar la línea `useEffect(() => { setMenuOpen(false); }, [pathname]);` (línea 78) por:

```tsx
useEffect(() => { setMenuOpen(false); setMensajesOpen(false); }, [pathname]);
```

- [ ] **Step 5: Insertar botón de mensajes antes del botón de notificaciones**

Reemplazar el botón de Notifications (líneas 154-159, comentario `{/* Notifications */}` y su botón) por:

```tsx
{/* Mensajes */}
<div className="relative" ref={mensajesRef}>
  <button
    onClick={() => setMensajesOpen((v) => !v)}
    className="relative rounded-lg p-2 text-text-3 transition-colors duration-150 hover:bg-surface-2 hover:text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    aria-label="Mensajes"
    aria-expanded={mensajesOpen}
    aria-haspopup="true"
  >
    <MessageCircle className="h-4 w-4" />
  </button>
  <ConversationsPopover open={mensajesOpen} onClose={() => setMensajesOpen(false)} />
</div>

{/* Notifications */}
<button
  className="relative rounded-lg p-2 text-text-3 transition-colors duration-150 hover:bg-surface-2 hover:text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
  aria-label="Notificaciones"
>
  <Bell className="h-4 w-4" />
</button>
```

- [ ] **Step 6: Verificar typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: sin errores.

- [ ] **Step 7: QA manual**

Con la app corriendo en `http://localhost:5173`, autenticado:
- El icono `MessageCircle` aparece a la izquierda del `Bell` en TopBar.
- Click en `MessageCircle` abre popover.
- Si no hay vinculaciones aceptadas/completadas, muestra empty state.
- Si las hay, muestra lista.
- Click fuera del popover lo cierra.
- Navegar a otra ruta lo cierra.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/layout/TopBar.tsx
git commit -m "feat(chat): icono y popover de mensajes en TopBar"
```

---

## Task 6: Montar ChatBubble en root para persistencia cross-page

**Files:**
- Modify: `apps/web/src/app/App.tsx`

- [ ] **Step 1: Importar ChatBubble en App.tsx**

Después del último import de feature (después de la línea 29 `import WelcomePage from '@/features/landing/WelcomePage';`), agregar:

```tsx
import ChatBubble from '@/features/chat/components/ChatBubble';
```

- [ ] **Step 2: Renderizar `<ChatBubble />` junto a `<Routes>`**

Reemplazar el `return ( <Routes>...</Routes> );` del componente (líneas 39-93) envolviendo en un fragmento y agregando `<ChatBubble />` al final:

```tsx
  return (
    <>
      <Routes>
        {/* ... todas las rutas existentes sin cambios ... */}
      </Routes>
      <ChatBubble />
    </>
  );
```

(El contenido dentro de `<Routes>` permanece intacto.)

- [ ] **Step 3: Verificar typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: sin errores.

- [ ] **Step 4: QA manual de persistencia cross-page**

Con la app corriendo:
- Abrir una conversación desde el popover del TopBar → aparece burbuja flotante en `bottom-4 right-4`.
- Navegar a otra ruta (`/perfil`, `/inicio`, etc.) → la burbuja persiste en la esquina.
- Click en botón minimizar → la burbuja se reduce a pill con avatar + nombre.
- Click en la pill minimizada → restaura.
- Click en X → la burbuja desaparece.
- Verificar que mensajes existentes se cargan y el envío funciona.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/App.tsx
git commit -m "feat(chat): montar ChatBubble en layout root para persistencia cross-page"
```

---

## Task 7: Cerrar burbuja al hacer logout

**Files:**
- Modify: `apps/web/src/stores/authStore.ts`

- [ ] **Step 1: Importar useBubbleStore en authStore**

Después de la línea 12 (`import type { AuthUser } from '@/lib/types';`) agregar:

```ts
import { useBubbleStore } from '@/stores/bubbleStore';
```

- [ ] **Step 2: Llamar a cerrar() dentro de logout()**

Reemplazar el método `logout` (líneas 112-115):

```ts
  logout: async () => {
    await signOut(auth);
    useBubbleStore.getState().cerrar();
    set({ user: null, firebaseUser: null });
  },
```

- [ ] **Step 3: Verificar que el test existente de authStore sigue pasando**

Run: `cd apps/web && npm test -- authStore`
Expected: PASS (los tests existentes no validan logout; si alguno se rompe, ajustar mock de bubbleStore en el archivo de test).

- [ ] **Step 4: QA manual**

- Abrir una burbuja.
- Click en "Cerrar sesión" del dropdown del avatar.
- Confirmar que la burbuja desaparece junto con el logout.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/authStore.ts
git commit -m "feat(chat): cerrar burbuja al hacer logout"
```

---

## Task 8: Botón "Abrir en burbuja" en VinculacionDetallePage

**Files:**
- Modify: `apps/web/src/features/vinculaciones/VinculacionDetallePage.tsx`

- [ ] **Step 1: Importar useBubbleStore y el icono**

Después de los imports existentes (después de la línea 12), agregar:

```tsx
import { ExternalLink } from 'lucide-react';
import { useBubbleStore } from '@/stores/bubbleStore';
```

- [ ] **Step 2: Calcular datos de la contraparte y agregar botón sobre el ChatWindow**

Reemplazar el bloque actual del chat (líneas 103-106):

```tsx
{/* Chat — visible en estado aceptada o completada */}
{(vinculacion.estado === 'aceptada' || vinculacion.estado === 'completada') && (
  <ChatWindow vinculacionId={vinculacion.id} otroInactivo={otroInactivo} />
)}
```

Por:

```tsx
{/* Chat — visible en estado aceptada o completada */}
{(vinculacion.estado === 'aceptada' || vinculacion.estado === 'completada') && user && (
  <div className="space-y-2">
    <div className="flex justify-end">
      <button
        onClick={() => {
          const contraparte = Number(user.id) === Number(vinculacion.oferente_id)
            ? { id: vinculacion.buscador_id, nombre: vinculacion.buscador_nombre, foto: vinculacion.buscador_foto }
            : { id: vinculacion.oferente_id, nombre: vinculacion.oferente_nombre, foto: vinculacion.oferente_foto };
          useBubbleStore.getState().abrir({
            vinculacionId: vinculacion.id,
            contraparte,
            ofertaTitulo: vinculacion.oferta_titulo,
            otroInactivo,
          });
        }}
        className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-text-2 transition-colors hover:bg-surface hover:text-text-1"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Abrir en burbuja
      </button>
    </div>
    <ChatWindow vinculacionId={vinculacion.id} otroInactivo={otroInactivo} />
  </div>
)}
```

- [ ] **Step 3: Verificar typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: sin errores.

- [ ] **Step 4: QA manual**

- Entrar a `/vinculaciones/:id` de una vinculación aceptada.
- Verificar que el botón "Abrir en burbuja" aparece arriba a la derecha del chat embebido.
- Click → la burbuja se abre con esa conversación.
- Navegar a otra página → la burbuja persiste.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/vinculaciones/VinculacionDetallePage.tsx
git commit -m "feat(chat): botón 'Abrir en burbuja' en detalle de vinculación"
```

---

## Task 9: Botón "Chatear" en items de MensajesPage

**Files:**
- Modify: `apps/web/src/features/chat/MensajesPage.tsx`

- [ ] **Step 1: Importar useBubbleStore y ajustar layout del item**

Reemplazar el contenido completo de `apps/web/src/features/chat/MensajesPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from '@/features/vinculaciones/components/EstadoBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { useBubbleStore } from '@/stores/bubbleStore';
import type { VinculacionCard } from '@/lib/types';

export default function MensajesPage() {
  const user = useAuthStore((s) => s.user);
  const abrirBurbuja = useBubbleStore((s) => s.abrir);

  const { data: aceptadas, isLoading: loadingA } = useListarVinculaciones({
    estado: 'aceptada',
    per_page: 50,
  });
  const { data: completadas, isLoading: loadingC } = useListarVinculaciones({
    estado: 'completada',
    per_page: 50,
  });

  const isLoading = loadingA || loadingC;
  const vinculaciones: VinculacionCard[] = [
    ...(aceptadas?.data ?? []),
    ...(completadas?.data ?? []),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const isInactivo = (v: unknown): boolean => v === true || v === 1 || v === '1';

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Mensajes</h1>

      {vinculaciones.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title="Sin conversaciones"
          subtitle="Las conversaciones aparecen cuando una vinculacion es aceptada"
        />
      ) : (
        <div className="space-y-3">
          {vinculaciones.map((v) => {
            const esBuscador = user?.id === v.buscador_id;
            const contraparte = esBuscador
              ? { id: v.oferente_id, nombre: v.oferente_nombre, foto: v.oferente_foto }
              : { id: v.buscador_id, nombre: v.buscador_nombre, foto: v.buscador_foto };
            const otroInactivo = esBuscador
              ? isInactivo(v.oferente_inactivo)
              : isInactivo(v.buscador_inactivo);

            return (
              <div
                key={v.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30"
              >
                <Link to={`/vinculaciones/${v.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
                    <p className="truncate text-xs text-text-3">{v.oferta_titulo}</p>
                  </div>
                </Link>
                <EstadoBadge estado={v.estado} />
                <button
                  onClick={() => abrirBurbuja({
                    vinculacionId: v.id,
                    contraparte,
                    ofertaTitulo: v.oferta_titulo,
                    otroInactivo,
                  })}
                  aria-label={`Chatear con ${contraparte.nombre}`}
                  className="rounded-md p-2 text-text-3 transition-colors hover:bg-surface-2 hover:text-accent"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: sin errores.

- [ ] **Step 3: QA manual**

- Navegar a `/mensajes`.
- Verificar que cada item muestra ahora un botón `MessageCircle` a la derecha del `EstadoBadge`.
- Click en el botón abre la burbuja sin navegar.
- Click en el resto del item navega a `/vinculaciones/:id` como antes.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/chat/MensajesPage.tsx
git commit -m "feat(chat): botón Chatear en items de /mensajes para abrir burbuja"
```

---

## Task 10: Verificación end-to-end y limpieza

**Files:** ninguno modificado; solo verificaciones.

- [ ] **Step 1: Correr suite de tests completa**

Run: `cd apps/web && npm test`
Expected: todos los tests pasan (incluidos los tres nuevos: bubbleStore, ChatBubble, ConversationsPopover, además de los preexistentes).

- [ ] **Step 2: Correr lint y typecheck**

Run: `cd apps/web && npm run lint && npm run typecheck`
Expected: sin errores.

- [ ] **Step 3: QA manual del flujo completo**

Con la app corriendo, autenticado y con al menos una vinculación aceptada:

1. **Popover TopBar:** click en `MessageCircle` → popover abre → click en conversación → burbuja abre + popover cierra.
2. **Persistencia cross-page:** con burbuja abierta, navegar a `/perfil`, `/inicio`, `/mis-ofertas` → burbuja sigue visible y conectada.
3. **Minimizar/restaurar:** botón minimizar → pill → click en pill → restaura.
4. **Cerrar:** botón X → burbuja desaparece.
5. **Cambio de conversación:** abrir popover con burbuja activa, elegir otra conversación → la burbuja muestra la nueva.
6. **Botón en vinculación:** entrar a `/vinculaciones/:id`, click en "Abrir en burbuja" → burbuja abre con esa conversación.
7. **Botón en /mensajes:** click en `MessageCircle` de un item → burbuja abre sin navegar; click en el resto del item navega como antes.
8. **Logout:** con burbuja abierta, cerrar sesión → burbuja desaparece.
9. **Móvil (DevTools < 640px):** burbuja abierta ocupa casi todo el viewport; popover del TopBar también; minimizada queda como pill.
10. **Chat embebido sigue idéntico:** abrir `/vinculaciones/:id` (vinculación aceptada) → el chat embebido se ve igual que antes del cambio (con el botón nuevo encima).

- [ ] **Step 4: Limpiar usuarios test si los creaste**

Si durante QA creaste usuarios de prueba, bórralos respetando la regla del proyecto:
- Preservar `dgarcia@planjuarez.org` y `test@test.com`.
- Borrar cualquier otro usuario test y su cascada (ofertas, vinculaciones, conversaciones).

- [ ] **Step 5: Commit final si quedó alguna fix menor**

Si las verificaciones encontraron algún ajuste, hacer un último commit:

```bash
git add <archivos>
git commit -m "fix(chat): <descripción del ajuste>"
```

Si no hubo ajustes, este step se salta.

---

## Self-review notes

- **Spec coverage:** los seis archivos modificados y los cuatro nuevos del spec están cubiertos por las tareas 1-9. Edge cases (logout, otroInactivo, doble listener, móvil) están en QA de tasks 6, 7, 8, 10.
- **Placeholders:** ninguno; todos los snippets son completos.
- **Type consistency:** `ContraparteMinima` se define una vez en Task 1 y se reusa con el shape correcto `{ id, nombre, foto }` en Tasks 3, 4, 8, 9. El payload de `abrir()` mantiene la misma forma en todos los call sites.
