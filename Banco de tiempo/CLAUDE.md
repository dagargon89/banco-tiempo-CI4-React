# CLAUDE.md — Banco de Tiempo (Participa Juárez)

Guía operativa para trabajar en este repositorio. Léela completa antes de escribir código.

## Qué es esto

**Banco de Tiempo** es una plataforma de voluntariado de habilidades de **Participa Juárez** (Plan Juárez, Ciudad Juárez). Los **Oferentes** publican habilidades que pueden enseñar y los **Buscadores** las descubren y contactan. La "moneda" es el tiempo compartido, no el dinero. Es un MVP.

El núcleo del dominio es la **vinculación (match)**: una máquina de estados `solicitada → aceptada → completada` (con `rechazada`/`cancelada`), con doble confirmación para completar y chat habilitado solo entre `aceptada`/`completada`.

## Stack (no improvisar otro)

| Capa | Tecnología |
|---|---|
| Backend | **CodeIgniter 4.7** — API REST JSON pura (`apps/api`) |
| Frontend | **React 19 + Vite 6 + TypeScript** — SPA (`apps/web`) |
| Estado cliente | TanStack Query (server-state) + Zustand (UI-state) |
| Estilos | Tailwind CSS 4 con los tokens del design system (doc 08) |
| Base de datos | **MySQL 8** — única fuente de verdad (identidad, autorización, dominio) |
| Autenticación | **Firebase Authentication** (email/contraseña, Google, Facebook, Microsoft). CI4 verifica el ID token con el Admin SDK |
| Chat tiempo real | **Cloud Firestore** — solo mensajes, autorizado por CI4 |
| Archivos | **Firebase Storage** — imágenes públicas (CDN) + documentos de identidad privados (cifrados app-side) |
| Caché/cola/throttle | Redis |
| Despliegue | VPS Linux; Nginx sirve la SPA y hace proxy a `/api` |

## Reglas no negociables

1. **El cliente nunca es de fiar.** Toda validación de negocio y autorización vive en CI4. React solo da UX previa. Jamás confiar en datos del SPA para decisiones de seguridad.
2. **MySQL es la única fuente de verdad.** Firestore es un canal de chat, Firebase Auth es el proveedor de identidad, Firebase Storage guarda blobs. Ninguno es autoridad de dominio: el estado real y los permisos se recalculan siempre contra MySQL.
3. **Seguridad por diseño (OWASP Top 10).** Ver `04-seguridad/04_plan_de_seguridad.md`. Resumen:
   - Autorización a nivel de **objeto**, no solo de ruta (PolicyServices + filtro `rbac:`). Denegación por defecto.
   - Query Builder / sentencias preparadas **siempre**. Cero concatenación de SQL.
   - `$allowedFields` en cada Model (anti mass-assignment). Nunca `id`, ni campos de estado controlados.
   - React auto-escapa; `dangerouslySetInnerHTML` prohibido salvo DOMPurify.
   - Documentos de identidad: **cifrados app-side antes de subir** a Firebase Storage (bucket privado deny-by-default); descarga solo por URL firmada efímera para moderador + auditoría.
   - Secretos solo en `.env` (nunca versionados). Sin `password_hash` ni JWT propio: la identidad la gestiona Firebase.
4. **Autenticación = verificar el ID token de Firebase** en cada petición (filtro `auth-firebase`, Admin SDK: firma RS256, `exp`, `aud`=projectId, `iss`). CI4 **no emite ni almacena** tokens de sesión. `email_verified` (Firebase) ≠ verificación de **identidad** (documento + moderador): son cosas distintas.
5. **Asíncrono donde duele.** Correos y reportes pesados van a cola (Redis). El request HTTP no espera por I/O lento.
6. **Transacciones ACID** en toda operación multi-tabla (`$db->transStart()/transComplete()`). La máquina de estados se valida en el Service antes de persistir.
7. **Toda transición/acción sensible se audita** en la tabla `auditoria` (append-only).

## Arquitectura en capas (backend)

`Filters` (cors, auth-firebase, rbac, throttle, secureheaders) → `Controllers` delgados → `Validation`/DTO → `PolicyServices` (autorización) → `Services` (negocio + transacciones) → `Repositories` (queries optimizadas, sin N+1) → `Models/Entities` (mapeo, $allowedFields) → MySQL. Efectos secundarios vía `Events`; trabajo pesado vía `Commands`/cola.

## Comandos

```bash
# Backend (apps/api)
composer install
cp env.example .env          # luego rellenar secretos (JWT no; Firebase sí)
php spark migrate --all      # crea el esquema (doc 03)
php spark db:seed InitialSeeder
php spark serve              # API en http://localhost:8080
composer test                # PHPUnit
vendor/bin/phpstan analyse   # estática

# Frontend (apps/web)
npm install
cp .env.example .env.local   # VITE_API_URL, config Firebase de cliente
npm run dev                  # SPA en http://localhost:5173 (proxy /api → 8080)
npm run build
npm run typecheck && npm run lint

# Infra local
docker compose up -d         # MySQL 8 + Redis
```

## Identidad visual (obligatoria)

La marca es **Participa Juárez**. Usar SIEMPRE los tokens de `01-vision/08_identidad_visual_design_system.md`:
- **Morado `#53155a`** = primario (CTA, activos). **Lima `#dbec57`** = realce, **con texto morado oscuro `#3A0F40`, nunca blanco**.
- Secundario morado claro `#7A3B82`. Categorías/semánticos/avatares rearmonizados y verificados AA.
- Tailwind: mapear los tokens en `@theme`. Regla de lint: prohibir `text-white` sobre `bg-lime`.

## Orden de lectura de la documentación

1. `README.md` — panorama e índice.
2. `01-vision/01_SRS_*.md` — qué hace el sistema (requisitos, roles, máquina de estados).
3. `02-arquitectura/02_arquitectura_sistema.md` + ADR **006** (stack), **007** (Storage), **008** (Auth) — cómo y por qué.
4. `03-datos/03_modelo_de_datos.md` y `05-api/05_especificacion_api.md` — referencia de implementación (ERD/DDL y endpoints).
5. `04-seguridad/04_plan_de_seguridad.md` — **lectura obligatoria** antes de tocar cualquier flujo sensible.
6. `06-pruebas/06_plan_de_pruebas.md` — red de seguridad y Definición de Hecho.
7. `07-roadmap/07_roadmap_sprints.md` — orden seguro de construcción (Sprint 0 → 10).
8. `08-ux/09_plan_mejoras_ux.md` — plan de mejoras UX/UI post-MVP (Sprints 8–10): mobile-first, skeletons, dark mode, charts, onboarding.

> Los ADR registran decisiones. Si algo en un documento viejo contradice un ADR, **prevalece el ADR** (p. ej. ADR-008 superó el esquema JWT del ADR-006 §5).

## Orden de construcción (resumen del roadmap)

Sprint 0 cimientos → 1 Auth+RBAC (Firebase) → 2 Verificación de identidad → 3 Ofertas+Explorar → 4 Vinculación (núcleo) → 5 Chat+Reseñas → 6 Admin+Métricas → 7 Endurecimiento → 8 UX Mobile+Skeletons → 9 UX Dark Mode+Charts → 10 UX Onboarding+Polish. **Nunca** construir una funcionalidad sensible antes que su control de seguridad.

## Definición de Hecho (por historia)

Pasa estática (PHPStan / ESLint+tsc), tiene pruebas unitarias y de feature que cubren sus criterios de aceptación, las pruebas de seguridad relevantes pasan, no introduce N+1 en rutas calientes, y la documentación afectada queda actualizada.

## Estructura del repo

```
banco-de-tiempo/
├── CLAUDE.md            ← este archivo
├── README.md
├── 01-vision/ … 08-ux/       ← documentación técnica (fuente de verdad)
├── apps/
│   ├── api/             ← CodeIgniter 4 (API)
│   └── web/             ← React 19 + Vite (SPA)
└── docker-compose.yml
```

> El scaffolding de `apps/` es un punto de partida coherente con la documentación, no una implementación final. Complétalo siguiendo los documentos y el roadmap.
