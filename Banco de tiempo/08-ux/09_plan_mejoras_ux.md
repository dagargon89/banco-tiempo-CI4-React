# Plan de Mejoras UX/UI
## Banco de Tiempo · Plataforma de Voluntariado de Habilidades

| Campo | Valor |
|---|---|
| Documento | 09 — Plan de Mejoras UX/UI |
| Versión | 1.0 |
| Fecha | 9 de junio de 2026 |
| Depende de | 01 — SRS, 07 — Roadmap, 08 — Identidad Visual y Design System |
| Alcance | Frontend React 19 SPA (`apps/web`). Define mejoras de experiencia de usuario para las tres secciones (Buscador, Oferente, Admin) alineadas con mejores prácticas 2025–2026 |

> **Contexto.** Sprint 7 completó el endurecimiento del MVP. Este documento define las mejoras de UX/UI posteriores al MVP funcional, priorizadas por impacto y esfuerzo. Todas las mejoras respetan el design system de la identidad Participa Juárez (doc 08) y las reglas no negociables de CLAUDE.md.

---

## 1. Estado actual — Diagnóstico

### 1.1 Fortalezas

| Área | Estado |
|---|---|
| Design system | Tokens CSS coherentes (morado + lima), paleta WCAG AA verificada |
| Navegación contextual | Sidebar context-aware (Buscador/Oferente/Admin) + role switcher + breadcrumbs |
| Accesibilidad base | ARIA labels, semántica HTML, focus-visible, htmlFor en inputs |
| Data fetching | TanStack Query con cache + Zustand para UI-state |
| Validación de formularios | Labels, char counters, error display, estados de loading en botones |
| Estados vacíos/carga | Spinners centrados y empty states con texto descriptivo |

### 1.2 Brechas críticas

| # | Brecha | Impacto | Detalle |
|---|---|---|---|
| B-01 | **Sin responsive mobile** | Crítico | Sidebar fijo 240px + `ml-60` en `AppLayout`. No hay hamburger menu, drawer ni bottom tabs. En viewports < 768px el contenido queda aplastado o inaccesible |
| B-02 | **Spinners genéricos en lugar de skeletons** | Alto | Cada página muestra `animate-spin` centrado mientras carga. El usuario percibe un salto abrupto de vacío a contenido completo. El patrón estándar desde 2023 es skeleton loading |
| B-03 | **Sin sistema de toasts** | Alto | Mutaciones exitosas redirigen silenciosamente o muestran texto estático verde. Sin feedback temporal tipo toast para operaciones asíncronas |
| B-04 | **Sin dark mode** | Medio | Los tokens CSS ya están en variables, pero solo existe un tema. En 2026 el dark mode es expectativa base de los usuarios |
| B-05 | **Sin onboarding** | Medio | Usuario nuevo post-registro no recibe guía. Sin tooltips, tours ni progress bar de completitud de perfil |
| B-06 | **Tablas admin no responsivas** | Alto | `<table>` HTML directo sin transformación mobile. En pantallas < 768px se recortan horizontalmente |
| B-07 | **Chat sin indicadores en tiempo real** | Medio | Sin "escribiendo...", sin mensajes leídos/no leídos, sin badge de no leídos en sidebar |
| B-08 | **Gráficas de métricas son DIVs** | Medio | `BarChart.tsx` usa `width: %` en divs. No es una librería de gráficas real. Sin tooltips, sin líneas de tendencia, sin selector de período |
| B-09 | **Filtros no persistidos en URL** | Medio | Los filtros de ExplorarPage se pierden al navegar y volver. No son compartibles por URL |
| B-10 | **Sin micro-interacciones** | Bajo | Transiciones limitadas a `transition-colors 150ms`. Sin stagger en grids, sin View Transitions, sin animaciones de éxito |

---

## 2. Principios de diseño (guía para todas las mejoras)

1. **Mobile-first.** Diseñar para 360px primero, escalar a desktop. Todo toque táctil ≥ 44px (WCAG 2.5.8).
2. **Feedback inmediato.** Toda acción del usuario recibe respuesta visual en < 100ms. Skeleton > spinner. Toast > redirect silencioso.
3. **Progressive disclosure.** Mostrar lo esencial primero, revelar complejidad bajo demanda (wizards, expandibles, drawers).
4. **Consistencia predecible.** Un patrón de interacción se repite igual en todas las secciones. Un componente = un comportamiento.
5. **Rendimiento percibido.** Optimistic updates, skeleton loading y stagger animations reducen la percepción de espera sin cambiar el tiempo real.
6. **Accesibilidad continua.** Live regions para contenido dinámico (chat, toasts). Focus trap en modales/drawers. Keyboard shortcuts para admin.

---

## 3. Mejoras transversales (aplican a las tres secciones)

### 3.1 Layout responsive mobile-first

**Problema:** B-01 — El sidebar fijo a 240px rompe la experiencia en viewports < 768px.

**Diseño propuesto:**

```
┌─ Desktop (≥ 1024px) ──────────────────────┐
│ ┌──────┬───────────────────────────┐       │
│ │      │ TopBar                    │       │
│ │ Side │───────────────────────────│       │
│ │ bar  │                           │       │
│ │ fijo │    Contenido              │       │
│ │      │                           │       │
│ └──────┴───────────────────────────┘       │
└────────────────────────────────────────────┘

┌─ Tablet (768–1023px) ─────────────────────┐
│ ┌──────────────────────────────────┐       │
│ │ ☰  Banco de Tiempo          🔔 👤│       │
│ ├──────────────────────────────────┤       │
│ │                                  │       │
│ │     Contenido (full width)       │       │
│ │                                  │       │
│ └──────────────────────────────────┘       │
│  Sidebar como drawer (overlay)             │
└────────────────────────────────────────────┘

┌─ Mobile (< 768px) ────────────────────────┐
│ ┌──────────────────────────────────┐       │
│ │ ☰  Banco de Tiempo          🔔 👤│       │
│ ├──────────────────────────────────┤       │
│ │                                  │       │
│ │     Contenido (full width)       │       │
│ │                                  │       │
│ ├──────────────────────────────────┤       │
│ │  🔍   👤   ➕   💬   ⚙️         │       │
│ └──────────────────────────────────┘       │
│  Bottom tab bar (5 items)                  │
│  Sidebar como drawer (hamburger)           │
└────────────────────────────────────────────┘
```

**Componentes nuevos:**

| Componente | Descripción |
|---|---|
| `MobileDrawer.tsx` | Sidebar como drawer lateral con overlay oscuro. Se abre con hamburger. Animación slide-in 200ms |
| `BottomTabBar.tsx` | Barra de 5 tabs fija en bottom (Explorar, Ofertas, Crear, Mensajes, Perfil). Visible solo en < 768px. Role switcher integrado |
| `AppLayout.tsx` (modificar) | Detectar breakpoint. Desktop: sidebar fijo + `ml-60`. Tablet/mobile: sin sidebar fijo, drawer + bottom tabs |

**Reglas de breakpoint:**

| Breakpoint | Sidebar | TopBar | Bottom tabs |
|---|---|---|---|
| ≥ 1024px (lg) | Fijo visible | Completo (breadcrumb + role switcher + avatar) | Oculto |
| 768–1023px (md) | Drawer (hamburger) | Hamburger + logo + notificaciones + avatar | Oculto |
| < 768px (sm) | Drawer (hamburger) | Hamburger + logo + notificaciones | Visible |

### 3.2 Skeleton loading system

**Problema:** B-02 — Spinners genéricos causan layout shift y percepción de lentitud.

**Componentes skeleton a crear:**

| Componente | Skeleton | Uso |
|---|---|---|
| `OfertaCardComponent` | `OfertaCardSkeleton` | ExplorarPage (grid de 12) |
| `VinculacionCard` | `VinculacionCardSkeleton` | VinculacionesPage (grid de 6) |
| Table row | `TableRowSkeleton` | Todas las tablas admin (5 rows) |
| `StatCard` | `StatCardSkeleton` | MisOfertasPage, AdminMetricasPage (4 cards) |
| Profile header | `ProfileHeaderSkeleton` | ProfilePage (avatar + datos) |
| Chat message | `MessageBubbleSkeleton` | ChatWindow (5 bubbles alternadas) |

**Implementación base:**

```tsx
// src/components/ui/Skeleton.tsx
// Div con bg-surface-2 + animate-pulse
// Props: className (para width/height), variant ('text' | 'circle' | 'rect')
```

**Regla:** cada página que hoy muestra `{isLoading && <Spinner />}` pasa a mostrar su skeleton específico. El skeleton replica las dimensiones exactas del contenido real para eliminar layout shift.

### 3.3 Sistema de toasts

**Problema:** B-03 — Sin feedback temporal para operaciones asíncronas.

**Solución:** Instalar `sonner` (2KB, accesible, composable con Tailwind).

**Patrón de uso:**

| Operación | Toast |
|---|---|
| Crear oferta | `toast.success('Oferta publicada')` |
| Aceptar vinculación | `toast.success('Vinculación aceptada. Ya puedes chatear')` |
| Rechazar vinculación | `toast.info('Vinculación rechazada')` |
| Error de red | `toast.error('Error de conexión. Intenta de nuevo')` |
| Subir documento | `toast.loading('Cifrando y subiendo...') → toast.success(...)` |
| Admin: aprobar verificación | `toast.success('Usuario verificado')` |
| Admin: suspender usuario | `toast.warning('Usuario suspendido')` |

**Componente wrapper:**

```tsx
// src/components/ui/Toaster.tsx
// <Toaster> montado en App.tsx, configurado con tokens del design system:
// --accent para success, --error para error, --warning para warning
// Posición: bottom-right en desktop, top-center en mobile
```

### 3.4 Dark mode

**Problema:** B-04 — Los tokens CSS ya están en variables pero solo hay tema claro.

**Implementación:**

```css
/* tokens.css — añadir bloque dark */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f14;
    --surface: #1a1a24;
    --surface-2: #24243a;
    --text-1: #f0f0f5;
    --text-2: #a0a0b8;
    --text-3: #60607a;
    --border: #2a2a3e;
    --border-strong: #3d3d5c;
    --accent-soft: #2a1a3a;
    --accent-2-soft: #261a30;
    --lime-soft: #1a1d10;
    /* accent, lime, semánticos: sin cambio (ya contrastan en oscuro) */
    --shadow-sm: 0 1px 2px rgba(0,0,0,.2), 0 1px 3px rgba(0,0,0,.3);
    --shadow-md: 0 4px 6px rgba(0,0,0,.25), 0 10px 20px rgba(0,0,0,.35);
    --shadow-lg: 0 12px 32px rgba(0,0,0,.5);
  }
}
```

**Toggle manual:** Icono sol/luna en TopBar. Persiste en `localStorage`. Clase `.dark` en `<html>` para override manual sobre `prefers-color-scheme`.

**Verificación:** todas las combinaciones de contraste del doc 08 §10 se re-verifican contra los colores dark. El morado `#53155a` como fondo se mantiene (ya es oscuro); los textos blancos sobre morado siguen cumpliendo AA.

### 3.5 Persistencia de filtros en URL

**Problema:** B-09 — Filtros de ExplorarPage se pierden al navegar y volver.

**Solución:** `useSearchParams` de react-router-dom en todas las páginas con filtros.

| Página | Parámetros en URL |
|---|---|
| ExplorarPage | `?cat=3&mod=virtual&zona=Centro&q=guitarra&page=2` |
| VinculacionesPage | `?tab=pendientes&page=1` |
| AdminUsuariosPage | `?verificacion=pendiente&cuenta=activa&q=maria&page=1` |
| AdminOfertasPage | `?estado=activa&cat=5&q=musica&page=1` |
| AdminTicketsPage | `?estado=abierto&tipo=reporte&q=spam&page=1` |

**Beneficios:** URLs compartibles, back button funciona como el usuario espera, refresh no pierde filtros.

### 3.6 Micro-interacciones y transiciones

**Problema:** B-10 — Transiciones limitadas a color changes.

**Mejoras:**

| Interacción | Animación | Implementación |
|---|---|---|
| Cards aparecen en grid | Fade-in + slide-up con stagger 50ms | CSS `@keyframes` + `animation-delay` por índice |
| Navegación entre páginas | Crossfade del contenido | `View Transitions API` (Chrome, polyfill para Firefox/Safari) |
| Botón submit exitoso | Checkmark animado 300ms | SVG `stroke-dashoffset` animation |
| Toggle sidebar mobile | Slide from left 200ms + overlay fade | CSS `transform: translateX` + `opacity` transition |
| Badge de notificación | Bounce-in al aparecer | CSS `@keyframes bounce-in` con scale |
| Tab activo | Underline slide con `transition: left, width` | CSS position absolute + transition 200ms |
| Card hover | Elevación + `translateY(-2px)` 150ms | Ya parcialmente implementado; estandarizar en todas las cards |
| Delete confirm | Shake 300ms si se cancela | CSS `@keyframes shake` |

---

## 4. Sección Buscador — Mejoras específicas

### 4.1 ExplorarPage — Rediseño de la experiencia de descubrimiento

**Estado actual:** Grid plano de cards + barra de filtros con `<select>` + paginación manual.

**Mejoras:**

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| BUS-01 | **Barra de búsqueda hero** | Input grande (48px alto) al tope de la página con icono lupa a la izquierda. Autocompletado de categorías y ofertas populares en dropdown. Placeholder: "Busca habilidades, personas o zonas..." | Alta |
| BUS-02 | **Categorías como chips scrolleables** | Remplazar `<select>` de categoría por fila de chips horizontales con scroll lateral (patrón UberEats/YouTube). Chip activo con `bg-accent text-white`. Chip "Todas" al inicio | Alta |
| BUS-03 | **Modalidad como radio pills** | Remplazar `<select>` de modalidad por grupo de 3 radio-buttons: "Todas", "Presencial", "Virtual" con estilo pill | Alta |
| BUS-04 | **Skeleton cards** | 12 `OfertaCardSkeleton` mientras carga, mismas dimensiones que las reales (ver §3.2) | Alta |
| BUS-05 | **Contador de resultados** | "12 ofertas encontradas" o "Sin resultados para 'piano' en Centro" debajo de filtros | Media |
| BUS-06 | **Infinite scroll** | Remplazar paginación manual por `IntersectionObserver` que carga siguiente página al llegar al fondo. Mantener botón "Cargar más" como fallback | Baja |
| BUS-07 | **Vista mapa** | Toggle lista/mapa para ofertas presenciales. Leaflet con markers por zona. Solo si `modalidad !== 'virtual'` | Baja |

**Diseño propuesto:**

```
┌────────────────────────────────────────────────────────────┐
│  🔍  Busca habilidades, personas o zonas...                │  ← hero search (48px)
├────────────────────────────────────────────────────────────┤
│ [Todas] [Arte] [Música] [Idiomas] [Tech] [Cocina] ►       │  ← chips scroll horizontal
├────────────────────────────────────────────────────────────┤
│  ○ Todas  ● Presencial  ○ Virtual    Zona: [Centro    ▼]  │  ← radio pills + zona
│  12 ofertas encontradas                                    │  ← contador
├────────────────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Card 1 │  │ Card 2 │  │ Card 3 │  │ Card 4 │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Card 5 │  │ Card 6 │  │ Card 7 │  │ Card 8 │          │
│  └────────┘  └────────┘  └────────┘  └────────┘          │
│                    ● ● ●  (scroll infinite)                │
└────────────────────────────────────────────────────────────┘
```

### 4.2 OfertaDetallePage — Mejorar conversión "Me interesa"

**Estado actual:** Botón "Me interesa" al fondo del scroll. Oferente card pequeño. Sin social proof.

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| BUS-08 | **Sticky CTA mobile** | Barra fija inferior (64px) en < 768px con avatar del oferente + "Me interesa" button. Desaparece si el usuario es dueño | Alta |
| BUS-09 | **Galería lightbox** | Click en thumbnail abre visor full-screen con navegación izq/der y gesto swipe en mobile | Media |
| BUS-10 | **Reseñas del oferente inline** | Sección bajo la descripción: "Reseñas de [Nombre]" con últimas 3 reseñas + link "Ver todas" | Media |
| BUS-11 | **Disponibilidad visual** | Chips de horarios coloreados: Mañanas (verde), Tardes (ámbar), Fines de semana (morado). Icono de reloj en cada uno | Media |
| BUS-12 | **Ofertas relacionadas** | Sección al final: "Otras ofertas en [categoría]" con 3 cards horizontales (query `categoria_id` excluyendo la actual) | Baja |

### 4.3 VinculacionesPage — Rediseño como timeline de progreso

**Estado actual:** Lista plana de cards con tabs (Todas, Pendientes, Activas, Historial).

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| BUS-13 | **Progress indicator por card** | Cada vinculación card muestra mini barra de progreso: ○─○─○─● con las fases (Solicitada → Aceptada → Completada). Fase actual resaltada | Alta |
| BUS-14 | **Quick actions en card** | Botones Aceptar/Rechazar directamente en la card del listado (sin entrar al detalle). Solo cuando el usuario tiene acciones disponibles | Alta |
| BUS-15 | **Badge de chat no leído** | Punto rojo con número en la esquina de la card si hay mensajes nuevos en esa vinculación | Media |
| BUS-16 | **Filtro por rol** | Tabs adicionales: "Donde soy buscador" / "Donde soy oferente" para filtrar perspectiva | Media |
| BUS-17 | **Timeline view** | Vista alternativa (toggle): timeline vertical completa con fechas, acciones y estados para cada vinculación | Baja |

### 4.4 Chat (MensajesPage + ChatWindow)

**Estado actual:** Lista de conversaciones con link a detalle. Sin indicadores de tiempo real.

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| BUS-18 | **Typing indicator** | Escribir un campo `isTyping: boolean` en Firestore subcollection. Mostrar "..." animado (3 dots bouncing) cuando el otro escribe | Alta |
| BUS-19 | **Badge de no leídos** | Campo `lastRead: timestamp` por participante en la conversación. Contar mensajes posteriores. Mostrar badge rojo en sidebar ("Mensajes (3)") y en cada conversación de la lista | Alta |
| BUS-20 | **Hora relativa** | Mensajes recientes muestran "Hace 2 min" / "Hace 1h". Mensajes del día: "14:32". Anteriores: "3 jun 14:32". Usar librería `date-fns/formatDistanceToNow` | Media |
| BUS-21 | **Scroll to bottom FAB** | Botón flotante "↓ Nuevos mensajes" cuando el scroll del chat no está al fondo. Desaparece al scrollear abajo | Media |
| BUS-22 | **Link preview** | Detectar URLs en mensajes con regex. Mostrar mini preview (título + favicon) debajo del mensaje. Fetched client-side con timeout de 3s | Baja |

### 4.5 Soporte (MisTicketsPage + TicketCrearPage)

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| BUS-23 | **Progress bar de estado** | Mostrar el estado del ticket como barra de progreso visual: Abierto → En proceso → Resuelto. La fase actual se resalta | Media |
| BUS-24 | **Comentarios inline** | Permitir al usuario agregar comentarios/updates al ticket sin crear uno nuevo. Hilo de conversación bajo el ticket | Media |
| BUS-25 | **FAQ antes de crear** | Al entrar a TicketCrearPage, mostrar primero: "¿Tu problema es alguno de estos?" con 5 FAQs expandibles. Si ninguna aplica: "Crear ticket" | Baja |

---

## 5. Sección Oferente — Mejoras específicas

### 5.1 MisOfertasPage — Dashboard actionable

**Estado actual:** Stats grid estático + lista de solicitudes sin jerarquía visual. El oferente no sabe qué priorizar.

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| OFE-01 | **Sección "Acciones pendientes"** | Bloque prominente al tope: "Tienes 3 solicitudes por responder" con lista de cards expandibles con Aceptar/Rechazar inline. Background `accent-soft` para urgencia visual | Alta |
| OFE-02 | **Stats con tendencia** | Cada stat card muestra delta semanal: "↑ 12% esta semana" en verde o "↓ 5%" en rojo. Requiere comparación con período anterior en API | Media |
| OFE-03 | **Calendario semanal** | Vista compacta de vinculaciones aceptadas esta semana: día, hora, oferta, contraparte. Formato visual similar a Google Calendar (bloques de color por categoría) | Media |
| OFE-04 | **Cards de oferta con métricas** | Cada oferta en "Mis habilidades" muestra: vistas totales, solicitudes recibidas, vinculaciones completadas. Requiere endpoint de stats por oferta | Baja |

**Diseño propuesto:**

```
┌────────────────────────────────────────────────────┐
│  ⚡ 3 acciones pendientes                           │  ← bloque urgencia
│  ┌────────────────────────────────────────────┐    │
│  │ 👤 María quiere "Clases de guitarra"       │    │
│  │ Hace 2h   [✓ Aceptar]  [✗ Rechazar]       │    │
│  ├────────────────────────────────────────────┤    │
│  │ 👤 Pedro quiere "Reparación de bici"       │    │
│  │ Hace 5h   [✓ Aceptar]  [✗ Rechazar]       │    │
│  └────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────┤
│  📊 [42 publicadas] [12 solicitudes] [8 activas]   │  ← stat cards
├────────────────────────────────────────────────────┤
│  📅 Esta semana                                     │  ← calendario
│  Lun 10:00  Guitarra con María (Virtual)           │
│  Mie 16:00  Bici con Pedro (Centro)                │
├────────────────────────────────────────────────────┤
│  🎸 Mis habilidades                                 │  ← grid de ofertas
│  ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │ 👁 42 │ │ 👁 18 │ │ 👁 7  │                        │
│  │Guitarra│ │Bici  │ │Inglés│                        │
│  └──────┘ └──────┘ └──────┘                        │
└────────────────────────────────────────────────────┘
```

### 5.2 Crear/Editar oferta — Wizard multi-paso

**Estado actual:** Formulario largo de un solo paso con 8+ campos. Riesgo de abandono.

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| OFE-05 | **Wizard 3 pasos** | Paso 1: "¿Qué ofreces?" (título, categoría, descripción breve y completa). Paso 2: "¿Cómo?" (modalidad, zona, tipo capacidad, capacidad máxima). Paso 3: "¿Cuándo?" (disponibilidad) + preview de la card. Navegación prev/next con validación por paso | Alta |
| OFE-06 | **Progress bar** | Barra segmentada en el top: "Paso 1 de 3 — Descripción". Segmentos completados en `--accent`, actual en `--accent`, pendientes en `--border` | Alta |
| OFE-07 | **Preview en vivo** | En el paso 3, mostrar cómo se verá la card en ExplorarPage. Usa los mismos componentes `OfertaCardComponent` con los datos del formulario | Media |
| OFE-08 | **Autoguardado en localStorage** | Guardar borrador cada 5 segundos en `localStorage` con key `oferta-draft-{userId}`. Al volver a la página: "Tienes un borrador guardado. ¿Continuar o empezar de nuevo?" | Media |
| OFE-09 | **Galería de imágenes drag-and-drop** | Permitir reordenar imágenes con drag-and-drop. Previsualización inline. Máximo 5 imágenes | Baja |

### 5.3 Notificaciones para el oferente

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| OFE-10 | **Web Push notifications** | Usar Push API + Service Worker. Notificar: nueva solicitud, mensaje de chat, vinculación confirmada. Botón "Activar notificaciones" en TopBar | Media |
| OFE-11 | **In-app notification center** | Dropdown desde el icono de campana (Bell) en TopBar. Lista de últimas 20 notificaciones con badge de no leídas. Cada notificación linkeada a la entidad | Media |

---

## 6. Sección Admin — Mejoras específicas

### 6.1 Dashboard de métricas (AdminMetricasPage)

**Estado actual:** `BarChart.tsx` usa divs con `width: %`. Sin tooltips, sin selector de período.

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| ADM-01 | **Librería de gráficas real** | Instalar `recharts` (o `nivo`). Remplazar BarChart.tsx DIV por: `<BarChart>` horizontal para categorías, `<LineChart>` para registros por período, `<PieChart>` para vinculaciones por estado. Tooltips, leyendas y responsive | Alta |
| ADM-02 | **Selector de período** | Tabs: "Última semana" / "Mes" / "Trimestre" / "Año". Cambia el query param `periodo` enviado al API. Requiere soporte de filtro de fecha en el backend | Alta |
| ADM-03 | **KPI sparklines** | Mini gráfica de tendencia (30 días) dentro de cada StatCard. Librería: `@nivo/sparkline` o SVG manual de ~10 puntos | Media |
| ADM-04 | **Comparación con período anterior** | Cada KPI muestra delta: "↑ 12% vs mes anterior" con flecha y color (verde/rojo) | Media |
| ADM-05 | **Export CSV** | Botón "Exportar" en cada gráfica. Genera CSV con los datos visibles y descarga al navegador | Baja |
| ADM-06 | **Auto-refresh** | Refetch automático cada 60s. Indicador en footer: "Actualizado hace 23s" con punto verde pulsante | Baja |

### 6.2 Tablas admin — Componente DataTable reutilizable

**Estado actual:** B-06 — Cada tabla admin repite markup HTML con props diferentes. Sin sort, sin batch actions, se rompe en mobile.

**Componente nuevo: `DataTable.tsx`**

| Feature | Detalle |
|---|---|
| **Responsive** | En < 768px transforma cada row en card apilada. Columnas seleccionadas se muestran como key-value pairs |
| **Ordenamiento** | Click en header de columna para sort asc/desc. Icono ↑↓ indica dirección. Solo client-side sobre datos cargados |
| **Selección múltiple** | Checkbox en cada row + checkbox master en header. Barra de acciones batch aparece al seleccionar: "3 seleccionados: [Suspender] [Exportar]" |
| **Column visibility** | Dropdown de columnas visibles para tablas con muchos campos (ej. AdminUsuariosPage) |
| **Row expansion** | Click en row expande panel inline con detalles sin navegar. Útil para tickets (ver descripción completa) |
| **Paginación integrada** | El componente incluye paginación al pie. Consistente en todas las tablas |
| **Empty state** | Integrado: muestra `EmptyState` si data.length === 0 |
| **Loading** | Integrado: muestra `TableRowSkeleton` × 5 si `isLoading` |

**Páginas que migran a `DataTable`:**

| Página | Columnas | Acciones batch |
|---|---|---|
| AdminUsuariosPage | ID, Nombre, Email, Verificación, Cuenta, Acciones | Suspender, Reactivar |
| AdminOfertasPage | ID, Título, Oferente, Categoría, Estado, Acciones | Despublicar |
| AdminTicketsPage | Folio, Tipo, Estado, Creador, Asignado, Fecha, Acciones | Tomar, Cerrar |

### 6.3 Verificaciones admin — Split view

**Estado actual:** Lista vertical de paneles expandibles. El moderador scrollea mucho. Sin queue prioritizada.

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| ADM-07 | **Split view** | Dos columnas: lista izquierda (40%) con nombre + fecha + badge, panel derecho (60%) con detalle completo + documento viewer + actions. Click en lista cambia panel derecho | Alta |
| ADM-08 | **Comparación lado a lado** | En el panel derecho: columna izq con foto del documento, columna der con datos del perfil (nombre, fecha nacimiento, etc.). El moderador compara visualmente | Alta |
| ADM-09 | **Queue counter con urgencia** | Header: "12 pendientes · 3 desde hace +48h" con semáforo (verde < 24h, amarillo 24–48h, rojo > 48h) | Media |
| ADM-10 | **Keyboard shortcuts** | `A` = Aprobar, `R` = Rechazar (muestra textarea), `↓` = Siguiente en queue, `↑` = Anterior. Tooltip de shortcuts en esquina | Media |
| ADM-11 | **Zoom del documento** | Zoom in/out con botones + scroll wheel. Rotate 90° para documentos escaneados en posición incorrecta | Media |

### 6.4 Tickets admin — Vista Kanban opcional

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| ADM-12 | **Toggle tabla ↔ kanban** | Botón en header para cambiar vista. Kanban: 4 columnas (Abierto, En proceso, Resuelto, Cerrado) con cards arrastrables entre columnas (drag-and-drop). Cambio de columna = cambio de estado | Media |
| ADM-13 | **SLA indicator** | Tiempo transcurrido desde apertura. Semáforo: verde < 24h, amarillo 24–48h, rojo > 48h. Visible en card y en tabla | Media |
| ADM-14 | **Carga por moderador** | En header: "Ana: 3 tickets · Luis: 7 tickets · Sin asignar: 4". Permite ver distribución de carga y reasignar | Baja |
| ADM-15 | **Notas internas** | Campo de texto visible solo entre moderadores (no al usuario). Útil para comunicar contexto de un caso | Baja |

### 6.5 Categorías admin — Mejora visual

| # | Mejora | Detalle | Prioridad |
|---|---|---|---|
| ADM-16 | **Drag to reorder** | Las categorías se reordenan con drag-and-drop. El orden afecta la visualización en ExplorarPage (chips) | Baja |
| ADM-17 | **Inline edit** | Click en nombre de categoría permite editarlo inline (input que aparece sobre el texto). Enter guarda, Escape cancela | Baja |

---

## 7. Onboarding y ayuda contextual

### 7.1 Flujo de onboarding para usuario nuevo

| Paso | Trigger | Componente | Contenido |
|---|---|---|---|
| 1 | Primera visita post-registro | `WelcomeModal.tsx` | Modal con 3 slides: (1) "Bienvenido a Banco de Tiempo", (2) "Ofrece tus habilidades o busca lo que necesitas", (3) "Completa tu perfil para empezar". Botón "Comenzar" cierra y redirige a `/perfil/editar` |
| 2 | Perfil incompleto (sin foto/bio/zona) | `ProfileCompletionBanner.tsx` | Banner persistente en top del contenido: "Tu perfil está al 40%. Complétalo para que otros te encuentren." Progress bar visual. Se oculta al completar. Persistido en `localStorage` |
| 3 | Sin verificación de identidad | `VerificacionBanner.tsx` | Ya existe y funciona correctamente. Sin cambios |
| 4 | Primera oferta | Tooltip en botón "Publicar habilidad" | Tooltip pulsante: "Comparte lo que sabes hacer con tu comunidad". Se muestra una vez (flag en `localStorage`) |
| 5 | Primera vinculación completada | `ConfettiCelebration.tsx` | Animación de confetti (canvas, 2s) + mensaje "¡Tu primer intercambio de tiempo!" Se muestra una vez |

### 7.2 Tooltips de ayuda

| Ubicación | Texto |
|---|---|
| ExplorarPage (primera visita) | "Aquí encontrarás habilidades que otros ofrecen. Usa los filtros para buscar lo que necesitas" |
| MisOfertasPage (sin ofertas) | Empty state enriquecido: "Aún no tienes habilidades publicadas. ¿Qué sabes hacer? Compártelo." + CTA "Publicar mi primera habilidad" |
| VinculacionesPage (vacía) | "Las vinculaciones aparecen cuando alguien se interesa en tu habilidad o tú en la de alguien más" |
| ChatWindow (primer mensaje) | "Este es tu espacio privado para coordinar. Acuerda los detalles del intercambio aquí" |

---

## 8. Accesibilidad avanzada

### 8.1 Mejoras pendientes

| # | Mejora | Detalle | WCAG |
|---|---|---|---|
| A11Y-01 | **Focus trap en drawers/modales** | Al abrir drawer/modal, el foco queda atrapado dentro. Tab no escapa. Escape cierra. Foco retorna al trigger al cerrar | 2.4.3 |
| A11Y-02 | **Live regions para toasts** | `<div role="status" aria-live="polite">` para toasts. Screen readers anuncian el mensaje sin interrumpir | 4.1.3 |
| A11Y-03 | **Live region para chat** | `aria-live="polite"` en la lista de mensajes. Nuevos mensajes se anuncian | 4.1.3 |
| A11Y-04 | **Skip to content** | Link oculto que aparece con Tab, salta al `<main>`. Útil para keyboard-only users con sidebar largo | 2.4.1 |
| A11Y-05 | **Reduced motion** | `@media (prefers-reduced-motion: reduce)` desactiva todas las animaciones y transiciones | 2.3.3 |
| A11Y-06 | **Error association** | Inputs con error deben tener `aria-describedby` apuntando al mensaje de error | 1.3.1, 3.3.1 |

---

## 9. Rendimiento percibido

| # | Mejora | Detalle |
|---|---|---|
| PERF-01 | **Optimistic updates** | TanStack Query `onMutate` para aceptar/rechazar vinculación, toggle de oferta, etc. UI se actualiza inmediatamente, revierte si falla |
| PERF-02 | **Code splitting por ruta** | `React.lazy()` + `Suspense` para admin pages, chat, verificación. Reduce bundle inicial |
| PERF-03 | **Image optimization** | Lazy loading (`loading="lazy"`) en imágenes de ofertas y avatares. `srcset` para densidades de pantalla |
| PERF-04 | **Virtual scrolling** | Para listas largas (chat con 100+ mensajes, reseñas): `@tanstack/react-virtual`. Renderiza solo lo visible |
| PERF-05 | **Prefetch en hover** | Links de navegación principal hacen prefetch de la query (TanStack `prefetchQuery`) al hover, antes del click |

---

## 10. Command palette (⌘K)

Componente de búsqueda global para power users y administradores.

**Trigger:** `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux).

**Secciones:**

| Sección | Items |
|---|---|
| Páginas | Explorar, Mis ofertas, Vinculaciones, Mensajes, Perfil, (Admin pages si tiene rol) |
| Acciones rápidas | Publicar oferta, Crear ticket, Cerrar sesión |
| Búsqueda (admin) | Buscar usuario por nombre/email, buscar oferta por título |

**Componente:** `CommandPalette.tsx` — Modal con input de búsqueda + lista filtrada de resultados. Keyboard navigation con ↑↓ + Enter. Escape cierra.

---

## 11. Priorización por sprint

### Sprint 8 — Impacto alto, esfuerzo bajo-medio

| # | Tarea | IDs relacionados | Estimación |
|---|---|---|---|
| 1 | Mobile layout (drawer sidebar + bottom tabs) | B-01, §3.1 | 3–4 días |
| 2 | Skeleton loading system | B-02, §3.2, BUS-04 | 2 días |
| 3 | Toast system (sonner) | B-03, §3.3 | 1 día |
| 4 | Filtros en URL (ExplorarPage) | B-09, §3.5 | 1 día |
| 5 | Chips de categoría en Explorar | BUS-02, BUS-03 | 1 día |
| 6 | DataTable responsive para admin | B-06, §6.2 | 3 días |
| 7 | Barra de búsqueda hero en Explorar | BUS-01 | 1 día |
| 8 | Progress indicator en vinculación cards | BUS-13 | 0.5 días |

**Hito Sprint 8:** La app es usable en mobile. Las cargas se perciben fluidas. Los filtros son compartibles por URL. Las tablas admin se adaptan a cualquier pantalla.

### Sprint 9 — Impacto alto, esfuerzo medio

| # | Tarea | IDs relacionados | Estimación |
|---|---|---|---|
| 1 | Dark mode | B-04, §3.4 | 2 días |
| 2 | Chat: badges de no leídos + typing indicator | B-07, BUS-18, BUS-19 | 3 días |
| 3 | Wizard multi-paso para crear oferta | OFE-05, OFE-06, OFE-07 | 3 días |
| 4 | Dashboard real charts (recharts) | B-08, ADM-01, ADM-02 | 2 días |
| 5 | Quick actions en vinculaciones y panel oferente | BUS-14, OFE-01 | 2 días |
| 6 | Sticky CTA mobile en detalle de oferta | BUS-08 | 0.5 días |
| 7 | Split view para verificaciones admin | ADM-07, ADM-08 | 2 días |

**Hito Sprint 9:** El oferente tiene un dashboard actionable. Los gráficos admin son reales. El chat tiene indicadores en tiempo real. Dark mode disponible.

### Sprint 10 — Impacto medio, esfuerzo medio-alto

| # | Tarea | IDs relacionados | Estimación |
|---|---|---|---|
| 1 | View Transitions API | §3.6 | 1.5 días |
| 2 | Onboarding flow (welcome modal + profile completion) | §7.1, §7.2 | 2 días |
| 3 | Kanban para tickets admin | ADM-12, ADM-13 | 3 días |
| 4 | Command palette (⌘K) | §10 | 2 días |
| 5 | Keyboard shortcuts en admin | ADM-10 | 1 día |
| 6 | In-app notification center | OFE-11 | 2 días |
| 7 | Web Push notifications | OFE-10 | 2 días |
| 8 | Accesibilidad avanzada (focus trap, live regions, skip link) | §8, A11Y-01 a A11Y-06 | 2 días |

**Hito Sprint 10:** La experiencia se siente pulida y profesional. Onboarding guía a usuarios nuevos. Admin tiene workflows optimizados con teclado y kanban.

---

## 12. Dependencias técnicas

| Dependencia | Sprint | Tipo |
|---|---|---|
| `sonner` | 8 | npm (toast notifications) |
| `recharts` o `@nivo/bar` + `@nivo/line` + `@nivo/pie` | 9 | npm (gráficas) |
| `@tanstack/react-virtual` | 10 | npm (virtual scrolling) |
| `date-fns` | 9 | npm (formateo de fechas relativas) |
| Endpoint API: stats por oferta | 9 (OFE-04) | Backend |
| Endpoint API: métricas con filtro de período | 9 (ADM-02) | Backend |
| Firestore fields: `isTyping`, `lastRead` | 9 (BUS-18, BUS-19) | Firebase |
| Endpoint API: notificaciones (CRUD + list) | 10 (OFE-11) | Backend |
| Service Worker para Push | 10 (OFE-10) | Frontend |

---

## 13. Métricas de éxito

| Métrica | Baseline (Sprint 7) | Objetivo (Sprint 10) |
|---|---|---|
| Usabilidad mobile (Lighthouse) | ~40 (estimado, sin responsive) | > 90 |
| Largest Contentful Paint | ~3s (spinner → contenido) | < 1.5s (skeleton → contenido) |
| Tasa de abandono en crear oferta | Desconocida | < 20% (con wizard) |
| Tiempo moderador por verificación | ~3 min (scroll + expand) | < 1 min (split view + shortcuts) |
| Cobertura dark mode | 0% | 100% de componentes |
| Accesibilidad (Lighthouse) | ~80 | > 95 |

---

*Documento 09 de la documentación técnica de Banco de Tiempo · Plan Juárez · v1.0 · 9-jun-2026*
