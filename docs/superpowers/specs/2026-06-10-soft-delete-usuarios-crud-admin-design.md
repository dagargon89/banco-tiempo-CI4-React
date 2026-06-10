# Soft Delete de Usuarios + CRUD Admin

| Campo | Valor |
|---|---|
| Spec | Soft delete de usuarios + CRUD admin (Ver/Editar/Borrar) |
| Versión | 1.0 |
| Fecha | 2026-06-10 |
| Estado | Aprobado por el usuario |
| Depende de | doc 03 (modelo de datos), doc 04 (seguridad), doc 05 (API) |
| Afecta a | `apps/api` (CI4), `apps/web` (React) |

---

## 1. Contexto y problema

El backend tiene `users.deleted_at` y `UserModel.useSoftDeletes = true`, pero ningún flujo lo usa. El estado `users.estado_cuenta = 'baja'` solo revoca sesiones Firebase; no afecta ofertas, vinculaciones, ni chats.

Las tablas admin (`AdminUsuariosPage`, `AdminOfertasPage`, `AdminTicketsPage`, `AdminCategoriasPage`) carecen de un patrón consistente para Ver/Editar/Borrar. Hoy cada una resuelve sus acciones de forma distinta (dropdowns ad-hoc, row expandible, lista de badges).

**Objetivo:** Implementar soft delete para usuarios con cascada lógica + un patrón uniforme de acciones Ver/Editar/Borrar en las cuatro tablas admin.

---

## 2. Decisiones clave (resumen)

| Pregunta | Decisión |
|---|---|
| Qué tablas | Usuarios, Ofertas, Tickets, Categorías |
| Cascada de ofertas al dar baja | Pausar automáticamente con flag `pausada_por_admin=1` |
| Cómo aparece el usuario inactivo en chats | Con nombre + chip "Inactivo" (no anonimizado) |
| Reseñas y vinculaciones históricas | Visibles con chip "Inactivo" |
| Edición de usuarios | Solo cambio de estado (no edición de perfil) |
| Vista de detalle | Drawer lateral derecho |
| Categorías | Activar/desactivar + editar nombre (sin borrado) |
| Reactivación de ofertas | Columna `pausada_por_admin` (approach A) |

---

## 3. Arquitectura

### 3.1 Backend (CodeIgniter 4)

- Nuevos Services en `apps/api/app/Services/`:
  - `UsuarioBajaService` — orquesta la baja transaccionalmente
  - `UsuarioReactivarService` — orquesta la reactivación
- Repositorios afectados (extender, no reescribir):
  - `OfertaRepository` — devuelve `oferente_inactivo` en queries con join a users
  - `VinculacionRepository` — devuelve `oferente_inactivo`, `buscador_inactivo`
  - `ResenaRepository` — devuelve `autor_inactivo`, `destino_inactivo`
  - `TicketRepository` — devuelve `creador_inactivo`
- Controllers nuevos/modificados (`apps/api/app/Controllers/Api/V1/Admin/`):
  - `Usuarios::show($id)` (nuevo)
  - `Usuarios::baja($id)` (nuevo)
  - `Usuarios::reactivar($id)` (nuevo)
  - `Ofertas::show($id)` (nuevo)
  - `Tickets::show($id)` (nuevo)
  - `Categorias::update($id)` (nuevo)
  - `Categorias::toggleActiva($id)` (nuevo)
- PolicyServices extendidos con métodos: `canDarBajaUsuario`, `canReactivarUsuario`, `canEditarCategoria`.

### 3.2 Frontend (React 19)

- Componente nuevo `src/components/ui/DetailDrawer.tsx`: panel derecho con focus trap, overlay, ESC cierra, slide-in 200ms.
- Componente nuevo `src/components/ui/UserName.tsx`: renderiza nombre con chip "Inactivo" si aplica.
- Componente nuevo `src/components/ui/ConfirmDialog.tsx`: modal de confirmación destructiva con motivo opcional y checkbox.
- Hook nuevo `src/lib/useFocusTrap.ts` (utilidad para drawer).
- Tipos extendidos en `src/lib/types.ts`: `User.inactivo`, `Oferta.pausada_por_admin`, `Oferta.oferente_inactivo`, `Vinculacion.oferente_inactivo`, `Vinculacion.buscador_inactivo`, `Resena.autor_inactivo`, `Resena.destino_inactivo`, `Ticket.creador_inactivo`.
- Páginas admin modificadas: las 4 tablas reciben columna "Acciones" estandarizada con iconos 👁 / ✏️ / 🗑.

### 3.3 Principio de separación

El admin nunca llama directo a `UserModel` desde un controller. Toda baja/reactivación pasa por el Service. La cascada (pausa de ofertas, revocación Firebase) vive en el Service, no en hooks del Model. Esto cumple la arquitectura en capas de CLAUDE.md.

---

## 4. Modelo de datos

### 4.1 Migración

Archivo: `apps/api/app/Database/Migrations/2026-06-10-000001_AddSoftDeleteCascadeFields.php`

```sql
-- Flag para distinguir pausas automáticas (baja de usuario) de pausas manuales
ALTER TABLE ofertas
  ADD COLUMN pausada_por_admin TINYINT(1) UNSIGNED NOT NULL DEFAULT 0
  AFTER estado;

CREATE INDEX idx_ofertas_pausada_por_admin ON ofertas (pausada_por_admin);

-- Metadata de la baja (motivo y quién la ejecutó)
ALTER TABLE users
  ADD COLUMN baja_motivo VARCHAR(500) NULL AFTER deleted_at,
  ADD COLUMN baja_por_user_id BIGINT UNSIGNED NULL AFTER baja_motivo,
  ADD CONSTRAINT fk_users_baja_por
    FOREIGN KEY (baja_por_user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### 4.2 Sin cambios

- `users.deleted_at` y `users.estado_cuenta` ya existen.
- `UserModel.useSoftDeletes = true` ya está activo.
- Tabla `auditoria` se reutiliza con nuevas acciones (sin schema change).

### 4.3 Acciones de auditoría nuevas

- `admin_dar_baja_usuario` — metadata: `{motivo, ofertas_pausadas}`
- `admin_reactivar_usuario` — metadata: `{ofertas_reactivadas}`
- `admin_editar_categoria` — metadata: `{antes, despues}`
- `admin_toggle_categoria` — metadata: `{activa_antes, activa_despues}`

---

## 5. Endpoints API

### 5.1 Nuevos

| Método | Ruta | Quién | Body / Params | Devuelve |
|---|---|---|---|---|
| `GET` | `/admin/usuarios/{id}` | moderador | — | Usuario + counts (`ofertas_activas`, `vinculaciones_completadas`, `resenas_recibidas`) + `baja: {fecha, motivo, dado_baja_por}` cuando aplique |
| `POST` | `/admin/usuarios/{id}/baja` | moderador | `{motivo: string?}` (≤500 chars) | `{ok: true, ofertas_pausadas: number}` |
| `POST` | `/admin/usuarios/{id}/reactivar` | moderador | — | `{ok: true, ofertas_reactivadas: number}` |
| `GET` | `/admin/ofertas/{id}` | moderador | — | Oferta completa + oferente (con `inactivo`) + counts |
| `GET` | `/admin/tickets/{id}` | moderador | — | Ticket completo + historial de cambios de estado |
| `PATCH` | `/admin/categorias/{id}` | super_admin | `{nombre: string}` | Categoría actualizada |
| `PATCH` | `/admin/categorias/{id}/activa` | super_admin | `{activa: boolean}` | Categoría actualizada |

### 5.2 Modificados

- `GET /admin/usuarios` — añadir query param `incluir_bajas` (default `false`). Sin él se filtran usuarios con `deleted_at`.
- `GET /admin/ofertas` — devuelve `pausada_por_admin: boolean` para que el frontend muestre badge específico.

### 5.3 Sin cambios

- `PATCH /admin/usuarios/{id}/estado` — sigue manejando `suspendida` / `activa` (estado_cuenta sin tocar `deleted_at`). Para `baja` ya **no** se usa; el frontend llama a `POST /baja`.

### 5.4 Códigos de error

| Caso | Status | Mensaje |
|---|---|---|
| `POST /baja` sobre usuario con `deleted_at IS NOT NULL` | 409 | "Usuario ya está dado de baja" |
| `POST /reactivar` sobre usuario con `deleted_at IS NULL` | 409 | "Usuario no está dado de baja" |
| `POST /baja` sobre el propio admin | 403 | "No puedes darte baja a ti mismo" |
| `POST /baja` sobre super_admin desde rol `moderador` | 403 | "Requiere super_admin" |
| `PATCH /admin/categorias/{id}` con nombre duplicado | 409 | "Ya existe una categoría con ese nombre" |
| Transición de ticket inválida (ej. `resuelto → abierto`) | 422 | Lista de transiciones válidas |

---

## 6. Lógica de soft delete del usuario

### 6.1 `UsuarioBajaService::darBaja(int $userId, ?string $motivo, int $actorId)`

**Pre-transacción (validaciones que abortan sin tocar DB):**

1. Usuario existe y `deleted_at IS NULL` → si no, lanza `409`.
2. Actor no es el mismo usuario → `403`.
3. Si target es `super_admin` y actor es solo `moderador` → `403`.

**Transacción (`$db->transStart()`):**

4. `UPDATE ofertas SET estado='pausada', pausada_por_admin=1, updated_at=NOW() WHERE user_id=? AND estado='activa'`
   → capturar `affectedRows()` en `$ofertasPausadas`.
5. `UPDATE users SET estado_cuenta='baja', deleted_at=NOW(), baja_motivo=?, baja_por_user_id=? WHERE id=?`
6. Insertar en `auditoria` acción `admin_dar_baja_usuario` con metadata JSON `{motivo, ofertas_pausadas}`.

**Cierre (`$db->transComplete()`):** si falla, todo revierte (incluye no llamar a Firebase).

**Post-transacción (efectos externos, no críticos para consistencia DB):**

7. `$firebaseAuth->revocarSesiones($user['firebase_uid'])` — fuerza logout en clientes. Si falla, log + auditoría con flag `firebase_revoke_failed=true`. **No** se revierte la baja (mejor inconsistencia con Firebase que con DB; Firebase se puede reintentar manualmente).

**Retorno:** `{ofertas_pausadas: $n}`.

### 6.2 `UsuarioReactivarService::reactivar(int $userId, int $actorId)`

**Pre-transacción:**

1. Validar `deleted_at IS NOT NULL` → si no, `409`.

**Transacción:**

2. `UPDATE ofertas SET estado='activa', pausada_por_admin=0 WHERE user_id=? AND pausada_por_admin=1`
   → capturar `affectedRows()` en `$ofertasReactivadas`.
3. `UPDATE users SET estado_cuenta='activa', deleted_at=NULL, baja_motivo=NULL, baja_por_user_id=NULL WHERE id=?`
4. Insertar en `auditoria` acción `admin_reactivar_usuario`.

**No se restauran sesiones Firebase** — el usuario debe re-loguearse.

**Retorno:** `{ofertas_reactivadas: $n}`.

### 6.3 Lo que NO se toca al dar baja

- Vinculaciones (todos los estados quedan como están)
- Mensajes de chat en Firestore (siguen ahí, accesibles por el otro participante)
- Reseñas escritas y recibidas
- Tickets creados por el usuario
- Documentos de verificación

### 6.4 Lo que se restringe automáticamente

- Login normal del usuario en baja → bloqueado por el filtro `auth-firebase` (ya verifica `estado_cuenta != 'baja'`)
- ExplorarPage no devuelve sus ofertas (filtra por `estado='activa'`)
- Endpoint de envío de mensaje rechaza si cualquiera de los dos participantes está en baja (`409` con mensaje "Conversación de solo lectura")
- Cloud Function rule de Firestore: si cualquiera de los dos UIDs tiene `estado_cuenta='baja'`, el envío falla. Defensa en profundidad.

---

## 7. UI: tablas con acciones y drawer

### 7.1 Componente `DetailDrawer`

- Ancho: `100%` mobile / `480px` tablet / `560px` desktop
- Overlay `bg-black/40` cubre el resto
- Focus trap (Tab no escapa). ESC cierra. Foco retorna al trigger al cerrar
- Header sticky: título + botón close
- Footer sticky: slot para acciones
- Body scrolleable
- Animación: slide-in 200ms

### 7.2 Patrón de columna "Acciones"

```
[👁 Ver]  [✏️ Editar]  [🗑 Borrar]
```

Iconos compactos con tooltip. En mobile, los iconos viven en la card (no en una columna que rompa el layout).

### 7.3 AdminUsuariosPage

| Acción | Comportamiento |
|---|---|
| 👁 Ver | DetailDrawer con perfil completo + stats + datos personales + estado verificación + auditoría reciente. Si está en baja: bloque rojo con motivo, fecha y quién lo dio de baja. |
| ✏️ Editar | Dropdown con opciones según estado actual: si `activa` → "Suspender" (PATCH /estado); si `suspendida` → "Reactivar suspensión" (PATCH /estado → activa); si `baja` → "Reactivar cuenta" (POST /reactivar — restaura ofertas también). |
| 🗑 Dar baja | Solo visible si `deleted_at IS NULL`. ConfirmDialog con input motivo (opcional) + checkbox "Confirmo que esto pausará N ofertas activas". Toast con resultado. |

Filtro nuevo: switch **"Incluir cuentas dadas de baja"**. Usuarios en baja aparecen con badge rojo "Baja" y solo tienen acción "Reactivar".

### 7.4 AdminOfertasPage

| Acción | Comportamiento |
|---|---|
| 👁 Ver | DetailDrawer con datos, imágenes, oferente (con flag `inactivo`), stats. Si `pausada_por_admin=1`: badge "Pausada por baja del oferente". |
| ✏️ Editar | No editamos contenido. Dropdown: "Despublicar", "Pausar"/"Reanudar". |
| 🗑 Despublicar | ConfirmDialog. Llama `PATCH /admin/ofertas/{id}/despublicar`. Misma lógica de hoy pero unificada con el patrón visual. |

### 7.5 AdminTicketsPage

| Acción | Comportamiento |
|---|---|
| 👁 Ver | DetailDrawer con descripción completa, historial de estados, creador (flag inactivo), entidad relacionada con link. **Reemplaza la row expandible actual.** |
| ✏️ Editar | "Cambiar estado" en dropdown con transiciones válidas. Si pasa a `resuelto`, exige textarea `resolucion`. |
| 🗑 — | Tickets no se borran (auditoría). Se cierran con estado `cerrado`. |

### 7.6 AdminCategoriasPage (super_admin)

Cambia de "lista de badges" a tabla:

| Columna | Notas |
|---|---|
| Nombre | Editable inline con ✏️ |
| Slug | Read-only (derivado del nombre) |
| Ofertas activas | Count |
| Estado | Badge "Activa" / "Inactiva" |
| Acciones | ✏️ Editar nombre · Toggle activar/desactivar |

Sin 👁 (la fila ya tiene toda la info). Sin 🗑 (solo desactivar).

### 7.7 ConfirmDialog (componente compartido)

- Título variable
- Mensaje
- Input opcional `motivo` (textarea ≤500 chars)
- Checkbox de confirmación cuando hay cascada ("Confirmo que pausará N ofertas")
- Botones "Cancelar" (secondary) + "Confirmar" (danger)
- Icono rojo + color de hover rojizo en acciones destructivas

---

## 8. Visualización de usuarios inactivos

### 8.1 Componente `<UserName>`

```tsx
<UserName nombre={vinc.oferente_nombre} inactivo={vinc.oferente_inactivo} />
```

- Activo: `María García`
- Inactivo: `María García` + chip pequeño gris "Inactivo" con tooltip "Esta cuenta fue dada de baja"

Sin tachado (sigue siendo legible y respetuoso).

### 8.2 Propagación del flag en repositorios

| Endpoint | Campo nuevo |
|---|---|
| `GET /vinculaciones`, `/vinculaciones/{id}` | `oferente_inactivo`, `buscador_inactivo` |
| `GET /ofertas/{id}` | `oferente_inactivo` |
| `GET /resenas/usuario/{id}` | `autor_inactivo`, `destino_inactivo` |
| `GET /tickets/{id}` | `creador_inactivo` |
| `GET /admin/usuarios` (con `incluir_bajas=true`) | `inactivo` |

Los repos usan `withDeleted()` en el query builder; sin esto, `useSoftDeletes=true` filtraría los joins y los nombres aparecerían como `null`.

### 8.3 Chat

- `MensajesPage`: cada conversación muestra `<UserName>` con chip si aplica
- `ChatWindow`: si el otro está inactivo:
  - Banner amarillo: *"Esta cuenta fue dada de baja. Puedes leer el historial pero no enviar nuevos mensajes."*
  - `ChatInput` con `disabled={true}` y botón Enviar oculto
  - Backend además bloquea POST de mensaje (Cloud Function + endpoint REST)

### 8.4 Reseñas (`ResenaCard`)

- Header con `<UserName>` y avatar atenuado (opacity 70%) cuando inactivo
- Botón "Reportar" oculto en reseñas de usuarios inactivos

### 8.5 Vinculaciones

- `VinculacionCard` y `VinculacionDetallePage` usan `<UserName>` para los dos participantes
- En `VinculacionDetallePage`:
  - Si alguno está inactivo y estado `aceptada`: banner + botón "Confirmar prestación" deshabilitado
  - Si estado `completada` y alguno está inactivo: form de reseña oculto

### 8.6 Perfil público

- Si se accede al perfil de un usuario inactivo (link directo o historial):
  - Avatar atenuado + nombre con chip "Inactivo"
  - Sin botones de acción
  - Reseñas recibidas siguen visibles
  - Banner: *"Esta cuenta fue dada de baja por su titular o por moderación."*

### 8.7 OfertaDetallePage

Si alguien aún tiene link a una oferta cuyo dueño está inactivo (la oferta debería estar `pausada_por_admin=1`):

- Página muestra la oferta + banner: *"Esta oferta está temporalmente fuera de servicio porque la cuenta del oferente fue dada de baja."*
- Botón "Me interesa" deshabilitado
- Card del oferente al pie con chip "Inactivo"

---

## 9. Edge cases

| Caso | Comportamiento |
|---|---|
| Admin intenta dar baja a sí mismo | `403` con mensaje claro. Botón oculto en su propia fila. |
| Moderador intenta dar baja a super_admin | `403`. Botón "Dar baja" deshabilitado con tooltip. |
| Doble click en "Dar baja" (race) | Idempotencia: service verifica `deleted_at IS NULL` dentro de la tx. Segundo intento → `409`. |
| Usuario en baja inicia sesión Firebase válida | Filtro `auth-firebase` rechaza con `401` "Cuenta dada de baja". Cliente cierra sesión. |
| Editar nombre de categoría que crea slug duplicado | `409`. Slug se regenera y se valida unicidad en transacción. |
| Categoría con ofertas activas se desactiva | Permitido. Las ofertas existentes conservan la categoría (FK intacta). Solo deja de aparecer en filtros de Explorar. |
| Cambio de estado de ticket inválido | `422` con lista de transiciones válidas. UI ya filtra, pero backend valida. |
| Revocación Firebase falla post-tx | Log + auditoría con `firebase_revoke_failed=true`. Baja se mantiene. Reintentar con comando spark. |
| Drawer abierto mientras el dato cambia en otra pestaña | TanStack Query refetch al focus. Si entidad ya no existe: "Este registro ya no está disponible" + cerrar. |
| Reactivar usuario con ofertas pausadas manualmente antes de la baja | Solo se reactivan las con `pausada_por_admin=1`. Las manuales quedan en `pausada`. |
| Cascada con miles de ofertas | El UPDATE es una sola query indexada. O(1) en queries. |
| Moderador que dio la baja es despedido y dado de baja | `baja_por_user_id` tiene `ON DELETE SET NULL`. Auditoría conserva el registro con el `actor_id` original. |

---

## 10. Permisos (RBAC)

| Acción | Roles permitidos |
|---|---|
| Ver/listar usuarios admin | `moderador`, `super_admin` |
| Dar baja a usuario regular | `moderador`, `super_admin` |
| Dar baja a moderador | `super_admin` solamente |
| Dar baja a super_admin | Nadie (bloqueado en código) |
| Reactivar usuario | `moderador`, `super_admin` |
| Editar nombre de categoría | `super_admin` |
| Toggle activar/desactivar categoría | `super_admin` |
| Ver detalle de oferta admin | `moderador`, `super_admin` |
| Despublicar oferta | `moderador`, `super_admin` |
| Ver detalle de ticket | `moderador`, `super_admin` |
| Cambiar estado de ticket | `moderador`, `super_admin` |

Las PolicyServices existentes se extienden con métodos nuevos (`canDarBajaUsuario`, `canReactivarUsuario`, `canEditarCategoria`).

---

## 11. Testing

### 11.1 Backend (PHPUnit)

- `UsuarioBajaServiceTest`:
  - Happy path completo (usuario → baja, ofertas pausadas, auditoría escrita).
  - Cada validación pre-transacción (auto-baja, super_admin desde mod, ya dado de baja).
  - Rollback en falla simulada (mock que lanza después del primer UPDATE).
  - Falla de Firebase post-tx no revierte la baja.
- `UsuarioReactivarServiceTest`:
  - Happy path simétrico.
  - **No** reactiva ofertas con `pausada_por_admin=0`.
- `Admin\UsuariosTest`: integración HTTP para los nuevos endpoints (401/403/409/422/200).
- `Admin\CategoriasTest`: integración para PATCH nombre y toggle.
- Cascada específica: usuario con 3 ofertas (2 activas, 1 pausada manualmente), dar baja, verificar que 2 se pausaron con flag y la 3ra quedó intacta. Reactivar, verificar simetría.

### 11.2 Frontend (Vitest)

- `DetailDrawer.test.tsx`: focus trap, ESC cierra, scroll lock body.
- `UserName.test.tsx`: chip "Inactivo" aparece con `inactivo=true`, no aparece sin él.
- `ConfirmDialog.test.tsx`: requiere checkbox para confirmar acción destructiva.
- Tests existentes de páginas admin se extienden para verificar nuevas acciones (botones existen y disparan handlers).
- `ChatWindow.test.tsx`: input deshabilitado cuando `otroInactivo=true`.

Sin tests E2E nuevos en este sprint.

---

## 12. Métricas de éxito

- Cero usuarios en `users` con `estado_cuenta='baja'` y `deleted_at IS NULL` (consistencia).
- Cero ofertas con `pausada_por_admin=1` cuyo dueño tenga `deleted_at IS NULL` (consistencia).
- Tiempo medio admin para dar baja a un usuario: < 30s (con drawer + confirm).
- Cero crashes del cliente al ver historial con usuario inactivo (regresión).

---

## 13. Resumen ejecutivo

1. **Arquitectura:** 2 servicios + 6 endpoints nuevos + flag `pausada_por_admin` + componente `DetailDrawer`.
2. **Datos:** 1 migración (3 columnas: `pausada_por_admin` en ofertas, `baja_motivo` + `baja_por_user_id` en users).
3. **API:** `POST /baja`, `POST /reactivar`, `GET` detalles, `PATCH` categorías.
4. **Soft delete:** transaccional, con cascada de pausa de ofertas, revocación Firebase post-tx, auditoría.
5. **UI:** drawer derecho, columna de acciones (👁 ✏️ 🗑), confirm modals con motivo, badge "Inactivo".
6. **Inactivos:** `<UserName>` con chip, chat solo lectura, banners en oferta/perfil/vinculación.
7. **Edge cases:** auto-baja bloqueada, idempotencia, cascada O(1), permisos RBAC.

---

*Diseño aprobado por el usuario el 2026-06-10 antes de proceder a la fase de implementación.*
