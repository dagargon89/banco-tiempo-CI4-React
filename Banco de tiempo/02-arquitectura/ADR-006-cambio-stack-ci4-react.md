# ADR-006 — Cambio de stack: CodeIgniter 4 + React/Vite

| Campo | Valor |
|---|---|
| Estado | **Aceptado** (el §5 sobre auth JWT fue **superado por [ADR-008](ADR-008-firebase-authentication.md)**) |
| Fecha | 3 de junio de 2026 |
| Reemplaza | Stack de README v1.0 y SRS §1.4 (Laravel 13 + Livewire 4 + Blade) |
| Depende de | 01 — SRS, 02 — Arquitectura, 03 — Modelo de Datos, 04 — Seguridad |
| Decisor | Arquitectura & Full-Stack |

---

## 1. Contexto

La documentación técnica v1.0 (29-may-2026) definió un **monolito Laravel 13 + Livewire 4 + Blade**, donde el servidor renderiza la UI y el estado reactivo vive en componentes Livewire. La dirección del proyecto decide cambiar a una arquitectura **desacoplada**: un backend **API-only en CodeIgniter 4** y un frontend **SPA en React 19 + Vite**.

El dominio, el modelo de datos relacional (3NF), la máquina de estados de la vinculación, el plan de seguridad OWASP y el design system **no cambian**. Lo que cambia es la tecnología de las capas de presentación y de aplicación, y el estilo de comunicación cliente↔servidor (de Livewire/sesión a SPA/API REST con JWT).

## 2. Decisión

Adoptar el siguiente stack para el MVP:

| Capa | Tecnología v1.0 (reemplazada) | Tecnología v2.0 (vigente) |
|---|---|---|
| Backend | Laravel 13 | **CodeIgniter 4.7.x** (API REST pura) |
| Lenguaje | PHP 8.3+ | PHP 8.3+ (sin cambio) |
| Presentación | Livewire 4 + Blade | **React 19 + Vite 6 + TypeScript** |
| Estado cliente | Componentes Livewire (servidor) | **TanStack Query** (server-state) + **Zustand** (UI-state) |
| Estilos | Tailwind CSS 4 | Tailwind CSS 4 (sin cambio; tokens idénticos) |
| Comunicación | HTTP + sesión + CSRF (Livewire) | **REST JSON + JWT (access corto) + refresh token en cookie HttpOnly** |
| Base de datos | MySQL 8 (fuente de verdad) | MySQL 8 (sin cambio) |
| Chat tiempo real | Cloud Firestore (acotado) | Cloud Firestore (sin cambio; Custom Token emitido por CI4) |
| Caché y colas | Redis | Redis (caché + cola simple basada en BD/Redis) |
| Auth API | Laravel Sanctum | **firebase/php-jwt + filtro `auth-jwt` propio** |
| Despliegue | VPS Linux, Nginx, PHP-FPM | VPS Linux, Nginx (sirve SPA estática + proxy a API), PHP-FPM |

## 3. Mapeo de conceptos Laravel → CodeIgniter 4

La arquitectura en capas se conserva; solo cambian los nombres y mecanismos del framework.

| Concepto (Laravel, doc v1.0) | Equivalente CodeIgniter 4 (doc v2.0) |
|---|---|
| Middleware | **Filters** (`app/Filters/*`, registrados en `Config\Filters`) |
| Controlador delgado | **Controller** / `ResourceController` (`App\Controllers\Api\V1\*`) |
| Componente Livewire | **Componente React** (el cliente ya no vive en el servidor) |
| Form Request (validación + autorización de entrada) | **Validation rules** + **Filter de autorización** + DTO de entrada |
| Policy / Gate (autorización de dominio) | **Service de autorización** (`*PolicyService`) invocado en el controlador/servicio |
| Service | **Service** (`App\Services\*`) — idéntico patrón |
| Repository | **Repository** (`App\Repositories\*`) sobre Query Builder / Model |
| Eloquent Model | **CI4 Model + Entity** (`App\Models\*`, `App\Entities\*`) |
| Jobs / Queues (Redis) | **Command + cola** (`spark` tasks) o jobs sobre cola en Redis/BD |
| Events / Listeners | **Events** de CI4 (`Events::on(...)`) |
| `DB::transaction()` | **`$db->transStart()` / `$db->transComplete()`** |
| `Crypt::encrypt()` | **`service('encrypter')->encrypt()`** |
| `Hash` (Argon2id) | **`password_hash($x, PASSWORD_ARGON2ID)`** |
| Sanctum tokens | **JWT (HS256)** firmado por la API, validado en filtro `auth-jwt` |
| Blade `{{ }}` (auto-escape) | **React** (auto-escapa JSX por defecto; `dangerouslySetInnerHTML` prohibido salvo DOMPurify) |

## 4. Consecuencias

### Positivas
- **Frontend fluido y desacoplado.** React + Vite da una SPA con transiciones rápidas, sin recargas, alineada con el prototipo aprobado (que ya es React).
- **Camino directo a móvil.** La misma API REST + JWT sirve a una futura app nativa sin reescribir el backend (consideración v2 del SRS §8).
- **Paridad con el prototipo.** El demo `banco-de-tiempo-demo.single.html` ya está construido en React; portarlo a un proyecto Vite real reduce el riesgo de desviación visual.
- **Backend más ligero.** CI4 es un framework pequeño y rápido; la API-only reduce superficie y dependencia.

### Negativas / Riesgos
- **Dos artefactos de despliegue** (SPA estática + API) en vez de un monolito; se mitiga sirviendo ambos tras el mismo Nginx.
- **Sanctum gratis se pierde:** la gestión de tokens (emisión, rotación, revocación) se implementa a mano con `firebase/php-jwt`. Se mitiga con un `TokenService` bien probado y refresh tokens persistidos/revocables en BD.
- **CSRF cambia de naturaleza:** al usar `Authorization: Bearer` para mutaciones, el CSRF clásico de cookie deja de aplicar a esos endpoints; el refresh token sí viaja en cookie y por tanto **requiere** protección CSRF específica (doble envío / SameSite=Strict). Ver §5.
- **Validación + autorización dejan de estar fusionadas** (no hay Form Request): se separan explícitamente en *validation rules* (formato) y *PolicyService* (permiso). Disciplina de equipo necesaria.

## 5. Implicaciones de seguridad del desacople (addendum al documento 04)

> ⚠️ **Superado por [ADR-008](ADR-008-firebase-authentication.md).** Los puntos 2–4 de esta sección describen el esquema de **JWT propio + refresh token** que se adoptó inicialmente. Ese esquema fue **reemplazado por Firebase Authentication**: ya no hay JWT propio, ni refresh tokens, ni contraseñas en MySQL. Se conserva esta sección como registro histórico de la decisión; para el diseño vigente de autenticación, ver ADR-008. Los puntos 1, 5 y 6 (Access Control, CORS y chat) siguen vigentes.

El plan de seguridad OWASP del documento 04 **sigue vigente en su totalidad**; este addendum solo ajusta los controles que cambian por el desacople SPA/API:

1. **A01 — Access Control.** Las *Policies* de Laravel se reimplementan como `*PolicyService` llamados explícitamente antes de toda acción sensible. La autorización a nivel de objeto (no solo de ruta) se mantiene: `VinculacionPolicyService::puedeVerChat($userId, $vinculacion)` replica exactamente la regla del documento 04 §A01.
2. **A02 — Cripto.** Argon2id vía `PASSWORD_ARGON2ID`. JWT firmado HS256 con secreto largo en `.env`. Refresh token: valor aleatorio de 256 bits, **hasheado** en BD (nunca en claro), rotado en cada uso.
3. **A07 — Auth.** Access token de vida corta (15 min). Refresh token (30 días) en **cookie HttpOnly + Secure + SameSite=Strict**, revocable y rotatorio (detección de reuso → revoca toda la familia). Throttling de login por IP+email con el `Throttler` de CI4.
4. **CSRF.** Endpoints mutantes autenticados por `Bearer` no son vulnerables a CSRF clásico (el token no viaja automático). El endpoint `/auth/refresh` que **sí** usa la cookie aplica `SameSite=Strict` + verificación de `Origin`/doble-envío.
5. **CORS.** Allowlist estricta del origen del SPA en `Config\Cors`; `supportsCredentials = true` solo para el endpoint de refresh.
6. **Chat (frontera MySQL↔Firestore).** Sin cambios: CI4 emite el Custom Token de Firebase con el Admin SDK tras validar el estado de la vinculación en MySQL. Las Security Rules del documento 04 §3 se conservan idénticas.

## 6. Alternativas descartadas

| Alternativa | Por qué se descartó |
|---|---|
| Mantener Laravel + Inertia/React | No cumple la directriz explícita de usar CodeIgniter en el backend. |
| Next.js (SSR) en el frontend | Sobre-ingeniería para un MVP de panel/exploración; el SEO no es crítico tras login y el equipo prioriza una SPA simple sobre Vite. |
| Sesión + cookie en vez de JWT | Acopla front y API al mismo dominio y complica la futura app móvil; se eligió JWT+refresh (decisión registrada en su momento, luego superada por Firebase Auth — ADR-008). |
| WebSockets propios para chat | Reintroduce infraestructura que Firestore ya resuelve; se mantiene Firestore. |

---

*ADR-006 · Banco de Tiempo · Plan Juárez · v2.0 · 3-jun-2026. Este ADR y los documentos 02, 05 y README prevalecen sobre las referencias de stack de la v1.0. Los documentos 01 (dominio), 03 (datos) y 04 (seguridad) siguen vigentes. El §5 (auth JWT) fue superado por ADR-008 (Firebase Authentication).*
