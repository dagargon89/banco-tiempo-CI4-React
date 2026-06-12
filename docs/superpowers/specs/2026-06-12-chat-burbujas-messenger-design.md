# Chat tipo Messenger con burbujas flotantes

**Fecha:** 2026-06-12
**Autor:** dgarcia@planjuarez.org (con asistente)
**Estado:** Aprobado para implementación
**Alcance:** Frontend (`apps/web`)

## Contexto

El chat actual de Banco de Tiempo está embebido dentro de la página `/vinculaciones/:id` (componente `ChatWindow`) y la página `/mensajes` funciona como índice de vinculaciones aceptadas/completadas. Para chatear, el usuario debe navegar a la vinculación específica.

Se quiere una experiencia tipo Facebook Messenger Web: un icono accesible desde cualquier página en el `TopBar` que abre un popover con conversaciones, y al elegir una se despliega una burbuja flotante de chat persistente entre navegaciones.

## Objetivos

- Permitir conversar sin abandonar la página actual.
- Acceso global al chat desde un icono en `TopBar`, al lado del de notificaciones (`Bell`).
- Reutilizar la lógica de chat existente (Firestore listener, custom token, envío de mensajes) sin duplicar código.
- Cambio acotado: una sola burbuja activa a la vez para evitar refactor del `chatStore` singleton.

## No-objetivos (out of scope)

- Badge de mensajes no leídos en el icono (queda para iteración siguiente; requiere endpoints backend + esquema MySQL + decisiones sobre polling vs Cloud Functions).
- Múltiples burbujas simultáneas.
- Persistencia de la burbuja entre recargas/sesiones.
- Notificaciones push.
- Estado "leído/no leído" por mensaje individual.

## Decisiones tomadas

| Decisión | Valor | Razón |
|---|---|---|
| Coexistencia con UI actual | Sí, burbujas son una capa adicional | Cambio mínimo, fácil de revertir, no rompe flujos existentes |
| Burbujas simultáneas | Una a la vez | Aprovecha `chatStore` singleton; evita refactor de Firebase Auth multi-token |
| Persistencia cross-page | Sí (burbuja vive en layout root) | Comportamiento esperado de Messenger |
| Persistencia entre sesiones | No (cierre = perdida) | Simplifica; Messenger Web se comporta igual al recargar |
| Badge de no leídos | No en esta iteración | Restricción técnica significativa (ver "Restricciones") |
| Puntos de entrada | Popover TopBar, botón en `/vinculaciones/:id`, botón en items de `/mensajes` | Acceso múltiple sin imponer un único flujo |

## Restricciones técnicas relevantes

### Custom token Firebase está acotado a una conversación

`apps/api/app/Services/FirebaseAuthService.php:100` emite un custom token con claim `conversation_id` específico. Las Firestore Rules (`firestore.rules:6`) requieren que `request.auth.token.conversation_id == convId`. Esto significa:

- Un cliente solo puede leer/escribir UNA conversación a la vez.
- No es viable un listener Firestore global de "todas las conversaciones del usuario" sin refactor de Rules + emisión de tokens.
- **Implicación para esta iteración**: badge de no leídos no entra; requeriría endpoints backend que tracken lecturas en MySQL (Enfoque B descartado).

### `chatStore` es singleton

Una sola conexión Firestore activa por aplicación. Esta iteración respeta ese contrato. Multi-burbuja en el futuro requerirá refactor.

## Arquitectura

### Archivos nuevos

```
apps/web/src/
├── stores/
│   └── bubbleStore.ts                       (Zustand store: estado UI de la burbuja)
├── features/chat/components/
│   ├── ChatBubble.tsx                       (shell flotante; consume bubbleStore + envuelve ChatWindow)
│   └── ConversationsPopover.tsx             (lista de vinculaciones desde el icono TopBar)
└── features/chat/components/__tests__/
    ├── bubbleStore.test.ts
    ├── ConversationsPopover.test.tsx
    └── ChatBubble.test.tsx
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `apps/web/src/components/layout/TopBar.tsx` | Icono `MessageCircle` antes del `Bell` + popover controlado |
| `apps/web/src/app/App.tsx` (o `main.tsx` `AppShell`) | Montar `<ChatBubble />` a nivel root para persistencia cross-page |
| `apps/web/src/features/chat/components/ChatWindow.tsx` | Nueva prop `variant?: 'embedded' \| 'bubble'` (default `'embedded'`) |
| `apps/web/src/features/chat/MensajesPage.tsx` | Agregar botón "Chatear" en cada item que abre burbuja sin navegar |
| `apps/web/src/features/vinculaciones/...` (pantalla de detalle) | Botón "Abrir en burbuja" junto al `ChatWindow` embebido |
| `apps/web/src/stores/authStore.ts` | `logout()` también llama a `bubbleStore.cerrar()` |

### Reglas de aislamiento

- `bubbleStore` no sabe de Firestore. Solo guarda metadata UI.
- Toda la lógica de conexión Firestore y envío de mensajes sigue dentro del `ChatWindow` reutilizado.
- `ConversationsPopover` usa `useListarVinculaciones` (igual que `MensajesPage`) — no duplica fetch.
- `ChatBubble` es presentación; envuelve un `ChatWindow` con `variant="bubble"`.

## Diseño detallado

### `bubbleStore.ts`

```ts
interface ContraparteMinima {
  id: number;
  nombre: string;
  foto: string | null;
}

interface BubbleState {
  vinculacionId: number | null;
  contraparte: ContraparteMinima | null;
  ofertaTitulo: string | null;
  otroInactivo: boolean;
  estado: 'cerrada' | 'abierta' | 'minimizada';
  abrir: (payload: {
    vinculacionId: number;
    contraparte: ContraparteMinima;
    ofertaTitulo: string;
    otroInactivo?: boolean;
  }) => void;
  minimizar: () => void;
  restaurar: () => void;
  cerrar: () => void;
}
```

- Sin `persist` middleware. Estado solo en memoria.
- `abrir()` siempre reemplaza la conversación previa y deja `estado = 'abierta'`.
- `cerrar()` resetea a valores iniciales (`null/'cerrada'`).

### `ConversationsPopover.tsx`

Props:
```ts
interface Props {
  open: boolean;
  onClose: () => void;
}
```

Comportamiento:
- Usa `useListarVinculaciones({ estado: 'aceptada' })` + `useListarVinculaciones({ estado: 'completada' })` y los combina (mismo patrón que `MensajesPage`).
- Layout: `absolute right-0 top-full mt-2 w-80 max-h-[480px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg`.
- Items: `Avatar + nombre contraparte + título oferta + EstadoBadge`. Click → `bubbleStore.abrir({...})` + `onClose()`.
- Footer: link "Ver todos los mensajes" → `/mensajes`.
- Loading: spinner inline.
- Empty state: `<EmptyState icon={<MessageCircle />} title="Sin conversaciones" subtitle="..." />`.

### `ChatBubble.tsx`

Sin props (consume `bubbleStore`).

Estados visuales:

| `estado` | Render |
|---|---|
| `'cerrada'` | `return null` |
| `'minimizada'` | Pill ~280×52px en `bottom-4 right-4`: avatar + nombre contraparte + botón restaurar. Click en header restaura. |
| `'abierta'` | Contenedor ~360×500px en `bottom-4 right-4`: header (avatar + nombre + minimizar + cerrar) + `<ChatWindow vinculacionId={...} variant="bubble" otroInactivo={...} />` |

Responsive:
- `< 640px` (móvil): burbuja abierta ocupa `inset-x-2 bottom-2 h-[70vh]`. Minimizada igual al desktop.
- `>= 640px`: tamaños fijos descritos arriba.

z-index: `z-40` (debajo del Toaster que sigue siendo `bottom-right`; el Toaster apila desde arriba hacia abajo por lo que en práctica no choca; si choca en pruebas, se ajusta el `offset` del `Toaster` en `main.tsx`).

### Cambios al `ChatWindow`

Nueva prop `variant?: 'embedded' | 'bubble'` con default `'embedded'`.

| Aspecto | `'embedded'` (actual) | `'bubble'` |
|---|---|---|
| Wrapper externo | `rounded-xl border border-border bg-surface` | Sin border ni rounded (lo pone el shell) |
| Zona de mensajes | `max-h-96 min-h-[200px]` | `flex-1` (llena la altura disponible) |
| Header interno (MessageCircle + "Chat") | Visible | Oculto (la burbuja ya tiene su propio header) |

Cambio aditivo: usos actuales con `<ChatWindow vinculacionId={n} otroInactivo={x} />` no cambian (default `'embedded'`).

### Modificación de `TopBar.tsx`

Insertar antes del botón `Bell` (línea 154):

```tsx
<div className="relative">
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
```

Click-outside con el mismo patrón del dropdown del avatar (extender el `useEffect` existente o usar otro `ref`).

Cerrar popover en cambio de ruta (`useEffect` con dependencia `pathname`, igual que línea 78).

### Modificación de `MensajesPage.tsx`

Cada item sigue siendo `<Link to="/vinculaciones/:id">` (default), pero se agrega un botón de acción rápida:

```tsx
<button
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); bubbleStore.abrir({...}); }}
  aria-label="Chatear en burbuja"
  className="..."
>
  <MessageCircle className="h-4 w-4" />
</button>
```

Doble afordance: click en el item navega; click en el botón abre burbuja.

### Modificación de la página de detalle de vinculación

Sobre el `ChatWindow` embebido, agregar pequeño botón "Abrir en burbuja" (icono externo) que llama `bubbleStore.abrir({...})` con los datos de la vinculación actual.

### Modificación de `authStore.logout()`

Antes (o después) de limpiar el `user`, llamar `useBubbleStore.getState().cerrar()` para evitar burbuja huérfana tras logout.

## Flujos clave

### Abrir burbuja desde popover

1. Click en icono `MessageCircle` del TopBar.
2. `ConversationsPopover` se abre, fetch de vinculaciones.
3. Click en un item → `bubbleStore.abrir({...})`, popover se cierra.
4. `<ChatBubble />` detecta `estado === 'abierta'` → renderiza shell + `<ChatWindow vinculacionId={x} variant="bubble" />`.
5. `ChatWindow` ejecuta `useChatToken.mutate(x)` → `connectToChat()` → `useChatMessages` listener.

### Cambiar de conversación con burbuja abierta

1. Burbuja muestra `vinculacionId=42`.
2. Usuario abre popover y elige `vinculacionId=58`.
3. `bubbleStore.abrir({vinculacionId: 58, ...})`.
4. `ChatWindow` ve cambio de prop → `useEffect` cleanup ejecuta `disconnect()` (cierra conexión Firestore previa).
5. `useEffect` corre con `vinculacionId=58` → nueva conexión.
6. Mensajes se repueblan.

### Navegación cross-page

`<ChatBubble />` está montado fuera del `<Routes>` en el layout root, por lo que React Router no lo desmonta. `chatStore` (Zustand) preserva la conexión activa entre rutas.

### Caso doble listener (misma vinculación)

Si el usuario está en `/vinculaciones/42` (con `ChatWindow` embebido) y abre la burbuja para vinculación 42, hay dos `ChatWindow` con el mismo `vinculacionId`. Como ambos comparten el `chatStore` singleton y Firebase de-duplica listeners idénticos, funciona aceptablemente. No se agrega lógica para evitarlo en esta iteración.

## Edge cases

| Caso | Manejo |
|---|---|
| Falla conexión Firestore | `ChatWindow` ya tiene UI de error; se muestra dentro de la burbuja igual que en el embebido |
| Custom token vence (1h) | Limitación existente del chat, no se introduce con este cambio |
| Logout con burbuja abierta | `authStore.logout()` invoca `bubbleStore.cerrar()` |
| Contraparte dada de baja | `bubbleStore.abrir()` acepta `otroInactivo?: boolean`; se propaga a `ChatWindow` |
| Misma vinculación abierta dos veces | Dos listeners aceptables (Firebase de-duplica) |
| Popover abierto, click fuera | Click-outside cierra popover |
| Recarga de página | Burbuja se cierra; icono del TopBar sigue accesible |
| Móvil (`< 640px`) | Burbuja abierta full-width; popover comportamiento similar |

## Pruebas

Tres tests unitarios nuevos en `apps/web/src/features/chat/components/__tests__/`:

1. **`bubbleStore.test.ts`** — transiciones de estado:
   - estado inicial es `'cerrada'`
   - `abrir()` setea estado `'abierta'` con payload
   - `abrir()` segundo call reemplaza valores
   - `minimizar()` cambia a `'minimizada'`, no toca otros campos
   - `restaurar()` regresa a `'abierta'`
   - `cerrar()` resetea todo a inicial

2. **`ConversationsPopover.test.tsx`** — con mocks de `useListarVinculaciones` y `useBubbleStore`:
   - renderiza loading state correctamente
   - renderiza empty state cuando no hay vinculaciones
   - renderiza lista de items
   - click en item llama `bubbleStore.abrir()` con payload correcto
   - click en item llama `onClose()`
   - link "Ver todos" apunta a `/mensajes`

3. **`ChatBubble.test.tsx`** — con `useBubbleStore` mockeado:
   - `estado === 'cerrada'` → renderiza `null`
   - `estado === 'minimizada'` → renderiza shell colapsado (sin `ChatWindow`)
   - `estado === 'abierta'` → renderiza `ChatWindow` con props correctas
   - botón cerrar invoca `cerrar()`
   - botón minimizar invoca `minimizar()`

No se agregan tests de integración con Firebase real (el flujo actual ya está cubierto a través de `ChatWindow`).

## Migración / despliegue

- Frontend-only. Sin cambios en backend, schema, ni Firestore Rules.
- Sin migraciones de datos.
- Despliegue convencional vía build de Vite.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Colisión visual entre burbuja y Toaster en `bottom-right` | Verificar en QA; si choca, ajustar `offset` del `Toaster` en `main.tsx` |
| Doble listener sobre misma vinculación genera lecturas extra Firestore | Aceptado; impacto mínimo. Si crece el problema en producción, V2 puede ocultar burbuja cuando se está en la página de su vinculación |
| Usuario espera badge de no leídos que no entregamos | Comunicar claramente en release notes que el badge llega en iteración siguiente |
| `variant="bubble"` rompe layout actual del `ChatWindow` embebido | Default es `'embedded'` (comportamiento idéntico al actual); cambio es aditivo |

## Trabajo futuro (fuera de alcance)

- Badge de no leídos (requiere diseño separado: polling backend vs Cloud Functions vs cambio de tokens Firebase).
- Múltiples burbujas simultáneas (requiere refactor de `chatStore` para gestionar N conexiones y posiblemente cambio de modelo de custom tokens).
- Persistencia de la burbuja en `localStorage` entre sesiones.
- Indicador "escribiendo..." (typing indicator) y "visto" (read receipts).
