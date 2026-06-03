# Especificación de la API
## Banco de Tiempo · Plataforma de Voluntariado de Habilidades

| Campo | Valor |
|---|---|
| Documento | 05 — Especificación de la API REST |
| Versión | 2.1 (Firebase Authentication) |
| Fecha | 3 de junio de 2026 |
| Auth | **Firebase Authentication — el SPA envía el ID token; CI4 lo verifica con el Admin SDK** |
| Base URL | `/api/v1` |
| Formato | JSON; `Content-Type: application/json` |
| Depende de | 01 — SRS, 03 — Modelo de Datos, 04 — Seguridad, [ADR-006](../02-arquitectura/ADR-006-cambio-stack-ci4-react.md), [ADR-008](../02-arquitectura/ADR-008-firebase-authentication.md) |

> **v2.1 (ADR-008).** La autenticación pasa a **Firebase Authentication**. Se eliminan los endpoints propios de login/refresh/logout/registro/recuperación y el esquema JWT+refresh; los sustituye `POST /auth/sync`. El resto de contratos (recursos, métodos, códigos) se conservan.

---

## 1. Convenciones

### 1.1 Versionado
Prefijo de versión en la URL: `/api/v1`. Cambios incompatibles incrementan la versión mayor.

### 1.2 Autenticación (Firebase Authentication)
Salvo endpoints públicos marcados, toda petición requiere `Authorization: Bearer {firebase_id_token}`. El **ID token** es un JWT que **emite Firebase** al iniciar sesión (email/contraseña, Google, Facebook o Microsoft) y que el **SDK del SPA refresca automáticamente**. CI4 lo verifica en cada petición con el filtro `auth-firebase` (Admin SDK: firma RS256 con claves públicas de Google, `exp`, `aud`=projectId, `iss`), resuelve el `firebase_uid` al usuario local de MySQL y deja en el request `userId`, `roles` y `verif`.

> CI4 **no emite ni almacena** tokens de sesión: no hay JWT propio, ni refresh tokens, ni cookies de sesión (ADR-008). El refresco es transparente en el cliente. Para forzar cierre de sesión global se usa `revokeRefreshTokens(uid)` del Admin SDK y los endpoints sensibles verifican con `checkRevoked=true`.

### 1.3 Códigos de estado

| Código | Uso |
|---|---|
| 200 | OK |
| 201 | Recurso creado |
| 204 | OK sin cuerpo (p. ej. logout) |
| 400 | Petición malformada |
| 401 | No autenticado |
| 403 | Autenticado pero sin permiso (PolicyService) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (p. ej. transición de estado inválida, duplicado) |
| 422 | Validación fallida |
| 429 | Rate limit excedido |
| 500 | Error interno (sin filtrar detalles) |

### 1.4 Formato de error estándar

```json
{
  "message": "El estado de la vinculación no permite esta acción.",
  "errors": {
    "estado": ["No se puede completar una vinculación que no está aceptada."]
  }
}
```

### 1.5 Rate limiting

| Grupo | Límite |
|---|---|
| Sincronización de sesión (`/auth/sync`) | 10 / minuto / IP |
| API autenticada general | 60 / minuto / usuario |
| Creación de ofertas y tickets | 10 / hora / usuario |

### 1.6 Paginación
Listados paginados con `?page=` y `?per_page=` (máx. 50). Respuesta con `data`, `meta` (total, página, por_página) y `links`.

---

## 2. Autenticación y cuentas (Firebase Authentication · ADR-008)

> El **inicio de sesión, el registro, la recuperación y la verificación de correo los gestiona Firebase Authentication** en el cliente (email/contraseña, Google, Facebook, Microsoft). La API no expone endpoints de login/refresh/logout/password: esos flujos ocurren contra Firebase con su SDK. La API solo necesita un endpoint para **sincronizar/aprovisionar** el usuario local a partir del ID token verificado.

### POST /api/v1/auth/sync — Bearer ID token de Firebase
Primer contacto tras iniciar sesión en Firebase. CI4 verifica el ID token (Admin SDK) y, si el `firebase_uid` no existe en MySQL, **crea el usuario** (aprovisionamiento Just-In-Time) tomando `name`/`email` del token; si existe, devuelve su perfil. Idempotente.

Request: *(sin cuerpo; la identidad viaja en el header)*
`Authorization: Bearer <firebase_id_token>`

Respuesta `200`:
```json
{
  "data": {
    "id": 12,
    "nombre": "Ana López",
    "email": "ana@ejemplo.mx",
    "email_verificado": true,
    "estado_verificacion": "no_verificado",
    "roles": [],
    "proveedor": "google.com"
  }
}
```
`401` ID token inválido/expirado/revocado · `403` cuenta `suspendida`/`baja`.

> **Cierre de sesión:** lo realiza el SPA con el SDK de Firebase (`signOut`). Para forzar cierre global desde el backend (p. ej. al suspender una cuenta), CI4 llama a `revokeRefreshTokens(uid)` del Admin SDK; los endpoints sensibles verifican con `checkRevoked=true`.
>
> **Verificación de correo y recuperación de contraseña:** flujos nativos de Firebase (correo de verificación / restablecimiento). La API no participa. La **verificación de identidad** (documento + moderador) es independiente y se mantiene (§4).

---

## 3. Perfil

### GET /api/v1/me — auth
Devuelve el perfil del usuario autenticado, sus roles y estado de verificación.

### PATCH /api/v1/me — auth
Actualiza `nombre`, `bio`, `foto_perfil`. `200` / `422`.

### GET /api/v1/usuarios/{id} — auth
Perfil público de un usuario: bio, ofertas activas, reseñas recibidas (no ocultas), calificación promedio.

---

## 4. Verificación de identidad

> **v2.0 (ADR-007).** Los documentos de identidad se almacenan en Firebase Storage (prefijo privado), cifrados app-side, con **subida directa desde el SPA** autorizada por un token acotado que emite CI4. Ver el patrón común en §4-bis.

### POST /api/v1/verificacion/upload-token — auth
Pide autorización para subir un documento de identidad. CI4 valida metadatos (`content_type`, `size`) y emite un token/URL de Storage acotado a `privado/identidad/{uid}/...`.
Request: `{ "content_type": "image/jpeg", "size": 482000, "tipo_documento": "ine" }`
Respuesta `200`: `{ "upload_token": "...", "ruta": "privado/identidad/12/ab34...enc", "expires_in": 300, "encryption_key_ref": "..." }`
`422` metadatos inválidos · `409` cuota/estado no permite subir.

### POST /api/v1/verificacion/documentos — auth
Notifica a CI4 que la subida a Storage terminó. CI4 persiste la `ruta`, asocia el `tipo_documento` y pasa el usuario a `pendiente`.
Request: `{ "ruta": "privado/identidad/12/ab34...enc", "tipo_documento": "ine" }`
`201` / `422` ruta no corresponde al usuario o no existe.

### GET /api/v1/verificacion/estado — auth
Devuelve el estado de verificación del usuario y motivo de rechazo si aplica.

---

## 4-bis. Subida de archivos a Firebase Storage (patrón común · ADR-007)

Toda subida (documentos de identidad, imágenes de oferta, foto de perfil) usa el mismo patrón de **subida directa con token acotado**: el binario no pasa por la API.

1. El SPA pide un token de subida al endpoint correspondiente (CI4 valida tipo/tamaño/estado y cuota).
2. CI4 responde con un token/URL de Storage acotado a una ruta concreta y de corta expiración.
3. El SPA sube el archivo **directo a Firebase Storage** (los documentos de identidad se cifran app-side antes).
4. El SPA confirma a CI4 la ruta resultante; CI4 la persiste en MySQL (y audita, para documentos de identidad).

### POST /api/v1/uploads/imagen-token — auth
Token de subida para una imagen pública (oferta o perfil). CI4 valida `content_type ∈ {image/jpeg,image/png,image/webp}` y `size ≤ 5 MB`, y acota la ruta a `publico/{uid}/...`.
Request: `{ "destino": "oferta" | "perfil", "content_type": "image/png", "size": 1200000 }`
Respuesta `200`: `{ "upload_token": "...", "ruta": "publico/12/of/9f...png", "expires_in": 300 }`
`422` tipo/tamaño inválido.

> Las Security Rules de Storage (doc 04 §3-bis) son la segunda barrera: imponen `contentType`, `size` y que la ruta coincida con el `uid`/claim del token. CI4 es la autoridad; el SPA nunca recibe credenciales amplias de Firebase.

---

## 5. Categorías

### GET /api/v1/categorias — público
Lista categorías activas. Cacheado.

---

## 6. Ofertas

### GET /api/v1/ofertas — público (exploración)
Lista ofertas `activa` paginadas. Filtros vía query string:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `categoria_id` | int | Filtra por categoría |
| `modalidad` | enum | `presencial` / `virtual` |
| `zona` | string | Coincidencia de zona |
| `disponibilidad` | string | `mananas` / `tardes` / `fines_semana` |
| `q` | string | Búsqueda en título/descripción |

Respuesta: tarjetas con oferente (id, nombre, foto, calificación), título, descripción breve, modalidad, zona, capacidad. Eager loading para evitar N+1.

### GET /api/v1/ofertas/{id} — público
Detalle completo: descripción, galería, perfil del oferente, disponibilidad, capacidad máxima.

### POST /api/v1/ofertas — auth (verificado)
Crea una oferta. Requiere `estado_verificacion = verificado` (validación + PolicyService en CI4).
```json
{
  "categoria_id": 6, "titulo": "Clases de guitarra para principiantes",
  "descripcion_breve": "Aprende acordes básicos en 4 sesiones.",
  "descripcion_completa": "…",
  "modalidad": "presencial", "zona": "Centro",
  "tipo_capacidad": "individual", "capacidad_maxima": 1,
  "disponibilidad": { "tardes": true, "fines_semana": true }
}
```
`201` / `403` no verificado / `422`. `zona` obligatoria si `modalidad = presencial`.

### PATCH /api/v1/ofertas/{id} — auth (dueño)
Edita la oferta. Autorización: solo el dueño (PolicyService). `200` / `403` / `422`.

### PATCH /api/v1/ofertas/{id}/estado — auth (dueño)
Pausar/reanudar/eliminar: `{ "estado": "pausada" }`. `200` / `409` transición inválida.

---

## 7. Vinculaciones (máquina de estados)

### POST /api/v1/ofertas/{id}/interes — auth (verificado, buscador)
Marca interés. Crea vinculación `solicitada`. Notifica al oferente.
`201` / `403` no verificado / `409` ya existe solicitud activa.

### GET /api/v1/vinculaciones — auth
Lista las vinculaciones del usuario (como buscador y como oferente), filtrable por `?estado=` y `?rol=oferente|buscador`.

### GET /api/v1/vinculaciones/{id} — auth (parte)
Detalle de una vinculación. Autorización: solo las partes o un moderador bajo reporte (PolicyService).

### PATCH /api/v1/vinculaciones/{id}/aceptar — auth (oferente)
`solicitada → aceptada`. Crea conversación y habilita chat. Notifica al buscador.
`200` / `409` estado inválido / `403`.

### PATCH /api/v1/vinculaciones/{id}/rechazar — auth (oferente)
`solicitada → rechazada`. Notifica. `200` / `409`.

### PATCH /api/v1/vinculaciones/{id}/cancelar — auth (parte)
`solicitada|aceptada → cancelada`. Registra `cancelada_por`. `200` / `409`.

### PATCH /api/v1/vinculaciones/{id}/confirmar — auth (parte)
Marca la confirmación de la parte (`confirmado_oferente` o `confirmado_buscador`). Cuando ambas son `true`: `aceptada → completada`, habilita reseña. Idempotente por parte.
`200` con el estado resultante / `409` si no está `aceptada`.

> Toda transición se ejecuta en una transacción y valida la máquina de estados del documento 01 §4. Una transición ilegal devuelve `409`, nunca corrompe el dato.

---

## 8. Chat

### POST /api/v1/vinculaciones/{id}/chat/token — auth (parte)
Devuelve un Custom Token de Firebase acotado a la conversación, **solo** si la vinculación está `aceptada`/`completada` y el usuario es parte.
```json
{ "firebase_custom_token": "eyJ...", "conversation_id": "conv_8f3a...", "expires_in": 3600 }
```
`200` / `403` no autorizado / `409` chat no habilitado.

> El contenido de los mensajes vive en Firestore; la API no los expone salvo el endpoint de auditoría administrativa (§11).

---

## 9. Reseñas

### POST /api/v1/vinculaciones/{id}/resena — auth (parte)
Crea reseña mutua. Requiere vinculación `completada`. Una sola por autor.
`{ "calificacion": 5, "comentario": "Excelente." }`
`201` / `409` no completada o ya reseñó / `422`.

### GET /api/v1/usuarios/{id}/resenas — público
Reseñas recibidas no ocultas, paginadas.

### POST /api/v1/resenas/{id}/reportar — auth
Marca la reseña como reportada y abre/asocia un ticket. `201`.

---

## 10. Tickets

### POST /api/v1/tickets — auth
Crea un ticket (reporte o sugerencia). Devuelve folio.
```json
{ "tipo": "reporte", "entidad_tipo": "oferta", "entidad_id": 44, "descripcion": "Contenido inapropiado." }
```
`201` con `{ "folio": "TK-2026-000123" }`.

### GET /api/v1/tickets/mios — auth
Tickets creados por el usuario y su estado.

---

## 11. Administración (rol moderador / super_admin)

Todos bajo `/api/v1/admin`, protegidos por el filtro `rbac:` (rol) + PolicyService (autorización de objeto). Acceso administrativo reforzado con MFA de Firebase.

| Método · Ruta | Rol | Descripción |
|---|---|---|
| GET `/admin/usuarios` | moderador | Lista con estado de verificación e historial de reportes |
| GET `/admin/verificaciones` | moderador | Cola de verificaciones `pendiente` |
| GET `/admin/verificaciones/{id}/documento` | moderador | URL firmada efímera al documento (Firebase Storage); registra auditoría |
| PATCH `/admin/verificaciones/{id}` | moderador | `{ "accion": "aprobar" }` o `{ "accion":"rechazar","motivo":"..." }`; notifica |
| PATCH `/admin/usuarios/{id}/estado` | moderador | Suspender / dar de baja (suspender → `revokeRefreshTokens` en Firebase) |
| PATCH `/admin/ofertas/{id}/despublicar` | moderador | Despublica una oferta |
| PATCH `/admin/resenas/{id}/ocultar` | moderador | Oculta una reseña reportada |
| GET `/admin/vinculaciones` | moderador | Seguimiento por estado |
| GET `/admin/vinculaciones/{id}/chat` | moderador | Lee el chat **solo** con reporte activo; registra auditoría |
| GET `/admin/tickets` | moderador | Bandeja de tickets |
| PATCH `/admin/tickets/{id}/asignar` | moderador | Asignar a un moderador |
| PATCH `/admin/tickets/{id}/estado` | moderador | Cambiar estado / documentar resolución |
| GET `/admin/metricas` | moderador | Métricas (§12) |
| POST `/admin/categorias` | super_admin | Alta de categoría |
| POST `/admin/moderadores` | super_admin | Alta de moderador (asigna rol en MySQL) |
| DELETE `/admin/moderadores/{id}` | super_admin | Revoca moderador |

---

## 12. Métricas

### GET /api/v1/admin/metricas — moderador
Respuesta agregada (cacheada, invalidada por evento):
```json
{
  "usuarios": { "registrados": 1280, "verificados": 940 },
  "registros_por_periodo": [ { "periodo": "2026-05", "total": 210 } ],
  "ofertas_activas_por_categoria": [ { "categoria": "Música", "total": 88 } ],
  "vinculaciones_por_estado": { "solicitada": 120, "aceptada": 75, "completada": 410, "cancelada": 33 },
  "tasa_aceptacion_por_categoria": [ { "categoria": "Idiomas", "tasa": 0.71 } ],
  "calificacion_promedio_plataforma": 4.6,
  "reportes": { "recibidos": 54, "tiempo_promedio_resolucion_horas": 19.4 },
  "actividad_por_zona": [ { "zona": "Centro", "vinculaciones": 130 } ]
}
```
Todas las cifras provienen de agregaciones SQL sobre MySQL (`GROUP BY`/`JOIN`), no de Firestore.

---

## 13. Trazabilidad endpoint → requisito

| Endpoint | Requisito SRS |
|---|---|
| `/auth/sync` (+ Firebase Auth en el cliente) | RF-AUT-01..07 |
| `/verificacion/*`, `/uploads/*`, `/admin/verificaciones/*` | RF-VER-01..07, RF-ADM-03 |
| `/ofertas` (GET) | RF-EXP-01..05 |
| `/ofertas` (POST/PATCH) | RF-OFE-01..05 |
| `/ofertas/{id}/interes`, `/vinculaciones/*` | RF-VIN-01..08 |
| `/vinculaciones/{id}/chat/token` | RF-MSG-01..03 |
| `/vinculaciones/{id}/resena`, `/usuarios/{id}/resenas` | RF-RES-01..05 |
| `/tickets/*`, `/admin/tickets/*` | RF-TIC-01..04, RF-ADM-08 |
| `/admin/*` | RF-ADM-01..10 |
| `/admin/metricas` | RF-MET (§3.11 SRS) |

---

*Documento 05 de la documentación técnica de Banco de Tiempo · Plan Juárez · v2.1 · 3-jun-2026*
