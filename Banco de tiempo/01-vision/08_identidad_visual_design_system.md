# Identidad Visual y Design System
## Banco de Tiempo · Plataforma de Voluntariado de Habilidades

| Campo | Valor |
|---|---|
| Documento | 08 — Identidad Visual y Sistema de Diseño |
| Versión | 3.0 (marca Participa Juárez: morado + lima) |
| Fecha | 3 de junio de 2026 |
| Origen | Logo "Participa Juárez" + prototipo aprobado `banco-de-tiempo-demo.single.html` |
| Dirección | SaaS moderno, limpio y profesional, con la identidad de Participa Juárez |
| Depende de | 01 — SRS |

> **v3.0 — Cambio de identidad.** La paleta de marca pasa a la de **Participa Juárez**: **morado `#53155a`** y **verde lima `#dbec57`** como colores primordiales. Los acentos, semánticos, categorías y avatares del prototipo (que eran esmeralda + índigo) se **rearmonizan** alrededor de estos dos colores manteniendo la estructura, las formas y las microinteracciones del prototipo aprobado. Toda combinación de color de este documento fue **verificada contra WCAG 2.1 AA** (ver §10).

---

## 1. Identidad de marca

| Atributo | Definición |
|---|---|
| Nombre | **Banco de Tiempo** (iniciativa de **Participa Juárez**) |
| Subtítulo / endoso | Plan Juárez · Ciudad Juárez, Chihuahua |
| Propósito | Plataforma de intercambio de conocimiento no monetario: enseñar y aprender habilidades entre la comunidad |
| Personalidad | Confiable, cercana, comunitaria, profesional sin ser fría |
| Tono visual | Limpio, mucho espacio en blanco, jerarquía clara, microinteracciones discretas |
| Antipatrones | Saturación juvenil, gradientes llamativos por todos lados, bordes excesivamente redondeados, ruido visual, texto blanco sobre lima |

**Colores de marca (del logo):**

| Color | Hex | Rol primordial |
|---|---|---|
| **Morado Participa** | `#53155a` | Color **primario**: CTA principales, estados activos, encabezados de marca, ancla visual de toda la interfaz |
| **Lima Participa** | `#dbec57` | Color de **realce/acento**: highlights, badges, detalles, iconos sobre fondo morado, números destacados. **Nunca lleva texto blanco** (ver §2.4 y §9) |

**Logotipo:** marca tipográfica "Banco de Tiempo" acompañada de un ícono simple. El acento de marca es el **morado `#53155a`**. Para piezas destacadas se admite el **gradiente de marca** `linear-gradient(120deg, #53155a, #7A3B82)` (morado → morado claro), usado con moderación en encabezados y avatares decorativos. El lima se reserva para tocar puntos de atención, no para rellenar superficies grandes.

---

## 2. Paleta de color

### 2.1 Tokens base (neutros y superficie)

Se conservan los neutros fríos del prototipo, con un matiz cálido-morado muy sutil en las superficies tintadas para que el morado de marca se sienta integrado.

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#F8FAFC` | Fondo general de la app |
| `--surface` | `#FFFFFF` | Tarjetas, paneles, modales |
| `--surface-2` | `#F4F1F6` | Superficie secundaria, fondos sutiles, hover de filas (tinte morado muy leve) |
| `--border` | `#E6E1EA` | Bordes de tarjetas, inputs, divisores (neutro con matiz morado) |
| `--border-strong` | `#CBC2D1` | Bordes en foco/hover, separadores marcados |
| `--text-1` | `#1E1421` | Texto principal y títulos (casi negro con base morada) |
| `--text-2` | `#6B5B6E` | Texto secundario, descripciones, metadatos |
| `--text-3` | `#9A8FA0` | Texto terciario, placeholders, deshabilitado |

### 2.2 Color de marca / acento

| Token | Hex | Uso |
|---|---|---|
| `--accent` | `#53155a` | **Primario de marca** (morado): CTA principal, estados activos, enlaces principales |
| `--accent-hover` | `#3F1045` | Hover/pressed del primario (morado más profundo) |
| `--accent-soft` | `#F3E8F5` | Fondo de realce suave del primario (chips, badges, tintes, ítem de menú activo) |
| `--accent-2` | `#7A3B82` | **Secundario** (morado claro, derivado de la marca): enlaces de datos, segundo CTA, rol Oferente |
| `--accent-2-hover` | `#632E6A` | Hover del secundario |
| `--accent-2-soft` | `#F0E6F2` | Tinte suave del secundario |
| `--lime` | `#dbec57` | **Realce de marca** (lima): highlights, números/insignias destacadas, iconos y detalles sobre morado |
| `--lime-ink` | `#3A0F40` | Color de **texto/icono que se coloca sobre el lima** (morado muy oscuro). Nunca blanco sobre lima |
| `--lime-soft` | `#F7FAD9` | Tinte lima muy suave para fondos de realce sutil |

### 2.3 Colores semánticos de estado

Mantienen su significado universal (verde = éxito, ámbar = advertencia, rojo = error, teal = info), ajustados a tonos algo más profundos que conviven con la marca y cumplen AA como texto.

| Token | Hex | Fondo suave | Uso |
|---|---|---|---|
| `--success` | `#15803D` | `#DCFCE7` | Éxito, confirmaciones |
| `--warning` | `#B45309` | `#FEF3C7` | Advertencia, pendiente |
| `--error` | `#BE123C` | `#FEE2E2` | Error, rechazo, prioridad alta |
| `--info` | `#0E7490` | `#E0F2FE` | Informativo, neutral-activo |

### 2.4 Regla de oro del lima

El lima `#dbec57` es un color **claro de alto brillo**: el texto blanco sobre él es ilegible (contraste 1.3, falla AA). Por tanto:

- **Sí:** lima como fondo de un badge/realce con **texto morado oscuro** (`--lime-ink`, contraste ≈ 10) — p. ej. una insignia "+1,800 vinculaciones" o un punto de atención.
- **Sí:** lima como **icono o detalle** sobre fondo morado `#53155a` (resalta con fuerza).
- **No:** lima como fondo de un botón con texto blanco.
- **No:** lima como color de texto sobre fondo blanco (contraste 1.3, invisible).
- **No:** grandes superficies en lima; es un acento puntual, no un color de relleno.

### 2.5 Colores de categoría (rearmonizados)

Cada categoría conserva un color distinguible, pero el conjunto se mueve a una familia más profunda y cohesiva con morado+lima. Todos cumplen AA como texto sobre blanco (chip) y como icono.

| Categoría | Color | Hex | Ícono (lucide) |
|---|---|---|---|
| Arte y Dibujo | Magenta-vino | `#A8326B` | `palette` |
| Manualidades | Ámbar quemado | `#B45309` | `scissors` |
| Música | Violeta | `#6D28D9` | `music` |
| Deportes | Teal profundo | `#0E7490` | `activity` |
| Idiomas | Verde bosque | `#15803D` | `languages` |
| Tecnología | Morado claro (marca 2) | `#7A3B82` | `cpu` |
| Cocina | Rojo-rosa profundo | `#BE123C` | `chef-hat` |
| Danza | Frambuesa | `#9D174D` | `disc` |
| Fotografía | Teal verdoso | `#0F766E` | `camera` |
| Otras | Gris-morado neutro | `#6B5B6E` | `grid` |

> Cada chip de categoría usa su color como texto/icono sobre un fondo suave del mismo tono al ~10–12% de opacidad. El color se asigna de forma estable por id.

### 2.6 Paleta rotatoria de avatares (`AV_COLORS`)

Familia de marca + apoyos, todos con contraste AA para iniciales blancas encima. Se asigna de forma estable por id para que un mismo usuario conserve su color.

`#53155a`, `#7A3B82`, `#A8326B`, `#0E7490`, `#15803D`, `#6D28D9`, `#BE123C`, `#0F766E`

> Variante decorativa de marca para avatares destacados: gradiente `120deg, #53155a, #7A3B82`.

### 2.7 Chips de estado de la vinculación

Colores para la máquina de estados (documento 01 §4), verificados como texto sobre su fondo suave.

| Estado | Color de texto/borde | Fondo |
|---|---|---|
| `solicitada` | `#B45309` (ámbar) | `#FEF3C7` |
| `aceptada` | `#53155a` (morado de marca) | `#F3E8F5` |
| `completada` | `#15803D` (verde) | `#DCFCE7` |
| `rechazada` | `#BE123C` (rojo) | `#FEE2E2` |
| `cancelada` | `#6B5B6E` (gris-morado) | `#F1EEF2` |

### 2.8 Colores de rol

| Rol | Color | Hex | Fondo suave |
|---|---|---|---|
| Oferente | Morado claro (marca 2) | `#7A3B82` | `#F0E6F2` |
| Buscador | Magenta-vino | `#A8326B` | `#F8E5EF` |

### 2.9 Prioridad de tickets

| Prioridad | Hex |
|---|---|
| Alta | `#BE123C` |
| Media | `#B45309` |
| Baja | `#6B5B6E` |

### 2.10 Insignias / gamificación

| Insignia | Color | Ícono |
|---|---|---|
| Miembro fundador | `#53155a` | `star` |
| Mentor de oro | `#B45309` | `award` |
| Aprendiz activo | `#0E7490` | `sparkles` |
| Siempre puntual | `#15803D` | `clock` |
| Favorita de la comunidad | `#A8326B` | `heart` |
| Mentor tech | `#7A3B82` | `cpu` |

### 2.11 Estrellas de calificación

Estrella activa **lima `#dbec57`** sobre superficies oscuras, o **ámbar `#D9A300`** sobre superficies claras (el lima puro no contrasta sobre blanco para una estrella pequeña). Estrella inactiva `#E6E1EA` (borde neutro).

---

## 3. Tipografía

| Rol | Familia | Notas |
|---|---|---|
| UI y texto | **Inter** | Familia principal de toda la interfaz. `'Inter', system-ui, -apple-system, sans-serif` |
| Display / acento | **Sora** | Para títulos grandes y piezas de marca puntuales (uso moderado) |
| Mono | `ui-monospace` | Folios, código, datos técnicos |

### 3.1 Escala tipográfica

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 36px | 800 | Títulos de landing/hero |
| H1 | 28px | 700–800 | Título de sección/página |
| H2 | 22–24px | 700 | Subtítulos, encabezados de tarjeta grande |
| H3 | 18–20px | 600–700 | Títulos de tarjeta |
| Body L | 16px | 400–500 | Texto principal |
| Body | 14px | 400–500 | Texto base de UI |
| Caption | 12–13px | 500–600 | Metadatos, etiquetas, chips |

**Pesos disponibles:** 400, 500, 600, 700, 800. El 800 se reserva para display y números destacados de métricas.

**Reglas:** títulos en `--text-1`; cuerpo secundario en `--text-2`; interlineado cómodo (1.4–1.6 en cuerpo); evitar mayúsculas sostenidas salvo en etiquetas pequeñas (`letter-spacing` ligero).

---

## 4. Forma de los componentes

### 4.1 Radios de borde

| Elemento | Radio |
|---|---|
| Inputs, botones, chips pequeños | 6–8px |
| Tarjetas, paneles, modales | 12–14px |
| Píldoras / badges de estado | 999px |
| Avatares | círculo (`border-radius: 50%`) |

### 4.2 Sombras (elevación)

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(30,20,33,.04), 0 1px 3px rgba(30,20,33,.06)` | Tarjetas en reposo |
| `--shadow-md` | `0 4px 6px rgba(30,20,33,.05), 0 10px 20px rgba(30,20,33,.07)` | Hover de tarjeta, dropdowns |
| `--shadow-lg` | `0 12px 32px rgba(30,20,33,.12)` | Modales, popovers, elementos flotantes |

Sombras suaves y de baja opacidad, ahora con base morada (`rgba(30,20,33,…)`) en vez de azul, para integrarse con la marca. La elevación comunica jerarquía, no decoración.

### 4.3 Espaciado

Sistema base **4px**. Escala: 4, 8, 12, 16, 20, 24, 32, 40, 48. Padding de tarjetas 20–24px; gap de grid 16–24px. El espacio en blanco es parte del estilo.

### 4.4 Bordes y divisores

Borde estándar `1px solid var(--border)`. En foco de inputs: borde `--accent` + halo suave (`box-shadow` de 3px con el morado al 15–20% de opacidad: `rgba(83,21,90,.18)`). Divisores internos en `--border` o `--surface-2`.

---

## 5. Catálogo de componentes

### 5.1 Botones

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| Primario | `--accent` (`#53155a`) → hover `--accent-hover` | blanco | CTA principal ("Me interesa", "Aceptar", "Quiero aprender") |
| Secundario | `--surface`, borde `--border` | `--text-1` | Acciones alternas ("Quiero enseñar") |
| Sutil / fantasma | transparente, hover `--surface-2` | `--text-2` | Acciones terciarias, iconográficas |
| Realce (lima) | `--lime` (`#dbec57`) | `--lime-ink` (`#3A0F40`) | Acción puntual de máxima atención; **texto morado oscuro, jamás blanco**. Uso escaso |
| Peligro | `--error` | blanco | Rechazar, eliminar |

Altura ~40px, padding horizontal 16px, radio 8px, peso 600, transición 150ms.

### 5.2 Tarjeta de oferta

Contenedor `--surface`, radio 12–14px, `--shadow-sm`, hover eleva a `--shadow-md` con leve `translateY(-2px)`. Composición: avatar del oferente (círculo con color estable de `AV_COLORS`), nombre + calificación, chip de categoría con su color, título (H3), descripción breve (`--text-2`, máx. ~150 car.), fila de metadatos con badges de modalidad, zona y capacidad.

### 5.3 Badge / chip de estado

Píldora (radio 999px), fondo suave + texto del color semántico correspondiente (ver §2.7), tamaño caption (12–13px), peso 600, padding 2–4px × 8–10px. Opcionalmente con punto de color o ícono a la izquierda.

### 5.4 Avatar

Círculo. Con foto: imagen recortada. Sin foto: iniciales **blancas** sobre color estable de `AV_COLORS` asignado por id. Variante decorativa de marca: gradiente `120deg, #53155a, #7A3B82`.

### 5.5 Tarjeta de métrica (KPI) y bloque destacado

Superficie blanca, radio 12px, ícono con color temático en contenedor de fondo suave, número grande (28–36px, peso 800, `--text-1`), etiqueta (`--text-2`). **Bloque destacado de marca** (como el panel "+1,800 vinculaciones" del prototipo): fondo **morado `#53155a`**, texto blanco, y el número/realce en **lima `#dbec57`** — esta es la combinación insignia de la marca y reemplaza el panel esmeralda del prototipo actual.

### 5.6 Burbujas de chat

Mensaje propio: fondo `--accent` (`#53155a`), texto blanco, alineado a la derecha. Mensaje del otro: fondo `--surface-2`, texto `--text-1`, alineado a la izquierda. Radio 12px con esquina recortada del lado del emisor. Marca de tiempo en caption `--text-3`.

### 5.7 Inputs y filtros

Fondo `--surface`, borde `--border`, radio 8px, altura ~40px. Foco con borde `--accent` + halo morado. Selects/segmented controls para filtros de exploración. Placeholder en `--text-3`. El control de segmento activo usa fondo `--accent-soft` y texto `--accent`.

### 5.8 Navegación

Sidebar en desktop (superficie blanca, ítem activo con tinte `--accent-soft` y texto/indicador `--accent`); bottom-nav o menú en mobile. Selector de rol (Buscador / Oferente / Administrador) en la barra superior, con el rol activo destacado en morado. Título de sección visible por pantalla.

> **Nota de migración respecto al prototipo:** en las capturas actuales el ítem de menú activo, los CTA y el panel destacado están en **esmeralda**; todos pasan a **morado `#53155a`**. El acento índigo de "Tecnología"/datos pasa al **morado claro `#7A3B82`**. El realce lima entra en el bloque destacado y en detalles puntuales.

---

## 6. Iconografía

Set **lucide** (líneas, esquinas redondeadas, grosor consistente). Tamaño base 20px en UI, 16px en chips, 24px+ en destacados. Color heredado del contexto (categoría, estado, `--accent` o `--text-2`). Sobre fondo morado, los iconos de realce pueden ir en **lima**. Nunca mezclar familias de íconos.

---

## 7. Movimiento

Transiciones discretas de 150–200ms (`ease`/`ease-out`) en hover, foco y cambios de estado. Elevación al pasar el cursor sobre tarjetas. Toasts deslizantes para feedback. Sin animaciones largas ni rebotes: el movimiento confirma, no entretiene.

---

## 8. Tokens listos para implementación (CSS / Tailwind)

```css
:root {
  /* superficie y neutros */
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --surface-2: #F4F1F6;
  --border: #E6E1EA;
  --border-strong: #CBC2D1;
  --text-1: #1E1421;
  --text-2: #6B5B6E;
  --text-3: #9A8FA0;
  /* marca: morado primario */
  --accent: #53155a;
  --accent-hover: #3F1045;
  --accent-soft: #F3E8F5;
  /* marca: morado claro secundario */
  --accent-2: #7A3B82;
  --accent-2-hover: #632E6A;
  --accent-2-soft: #F0E6F2;
  /* marca: lima de realce (texto oscuro encima, nunca blanco) */
  --lime: #dbec57;
  --lime-ink: #3A0F40;
  --lime-soft: #F7FAD9;
  /* semánticos */
  --success: #15803D;
  --warning: #B45309;
  --error: #BE123C;
  --info: #0E7490;
  /* elevación (base morada) */
  --shadow-sm: 0 1px 2px rgba(30,20,33,.04), 0 1px 3px rgba(30,20,33,.06);
  --shadow-md: 0 4px 6px rgba(30,20,33,.05), 0 10px 20px rgba(30,20,33,.07);
  --shadow-lg: 0 12px 32px rgba(30,20,33,.12);
  /* radios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --radius-pill: 999px;
  /* tipografía */
  --font-ui: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Sora', 'Inter', sans-serif;
  /* gradiente de marca */
  --brand-gradient: linear-gradient(120deg, #53155a, #7A3B82);
}
```

Para **Tailwind 4**, declarar estos tokens en el bloque `@theme` (o mapearlos en `theme.extend` si se usa config JS), de modo que las utilidades (`bg-accent`, `text-text-2`, `bg-lime`, `rounded-md`, `shadow-sm`) usen exactamente estos valores. Regla de lint recomendada: prohibir `text-white` en cualquier elemento con `bg-lime`.

---

## 9. Principios de aplicación

1. **Morado primero, lima para destacar.** El morado `#53155a` es el ancla visual y el CTA. El lima `#dbec57` es un acento puntual de atención, nunca relleno de grandes áreas.
2. **El lima nunca lleva texto blanco.** Sobre lima siempre va `--lime-ink` (morado oscuro). Sobre blanco el lima no sirve como texto.
3. **Blanco como respiración.** El espacio en blanco estructura la pantalla; no rellenar por rellenar.
4. **El color comunica estado, no decora.** Categoría, rol, estado y prioridad tienen color con significado.
5. **Familia de marca en los acentos.** El secundario y varias categorías son tonos morados/profundos de la misma familia para que todo se vea de Participa Juárez.
6. **Consistencia de radio y sombra.** Misma familia de formas; sombras con base morada.
7. **Accesibilidad AA.** Contraste mínimo AA en texto y componentes; foco siempre visible (halo morado); objetivos táctiles ≥ 40px.
8. **Paridad demo ↔ producción.** La estructura y las microinteracciones del prototipo aprobado se conservan; solo cambia la capa de color a la nueva marca.

---

## 10. Verificación de contraste (WCAG 2.1 AA)

Combinaciones clave verificadas (umbral AA: texto normal ≥ 4.5, texto grande/UI ≥ 3.0):

| Combinación | Ratio | AA |
|---|---|---|
| Texto blanco sobre morado `#53155a` | 12.94 | ✅ |
| Texto morado `#53155a` sobre lima `#dbec57` | 9.95 | ✅ |
| Texto blanco sobre lima `#dbec57` | 1.30 | ❌ (prohibido por diseño) |
| Texto `--lime-ink` `#3A0F40` sobre lima `#dbec57` | ~12 | ✅ |
| Texto blanco sobre secundario `#7A3B82` | 7.57 | ✅ |
| Morado `#53155a` como texto sobre blanco | 12.94 | ✅ |
| Hover `#3F1045` con texto blanco | 15.31 | ✅ |
| Cada color de categoría como texto sobre blanco | 5.0–7.9 | ✅ |
| Semánticos (success/warning/error/info) sobre su fondo suave | 4.5–5.2 | ✅ |
| Iniciales blancas sobre cada `AV_COLOR` | 5.0–12.9 | ✅ |
| Chips de estado de vinculación (texto sobre fondo suave) | 4.5–10.9 | ✅ |

> Todos los valores se calcularon con la fórmula de luminancia relativa de WCAG 2.1. Cualquier color nuevo que se agregue debe verificarse contra AA antes de entrar al sistema.

---

*Documento 08 de la documentación técnica de Banco de Tiempo · Plan Juárez · v3.0 · 3-jun-2026*
