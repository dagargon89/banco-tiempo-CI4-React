# Banco de Tiempo — Documentación Técnica del Proyecto
### Plataforma de Voluntariado de Habilidades · Plan Juárez

> Sistema de intercambio de conocimiento no monetario donde **Oferentes** publican habilidades que pueden enseñar y **Buscadores** las descubren y contactan. Documentación de ingeniería para el desarrollo del MVP aprobado.

| | |
|---|---|
| **Organización** | Plan Juárez · Ciudad Juárez, Chihuahua |
| **Estado** | Reestructurado a stack desacoplado — scaffolding base listo |
| **Versión doc.** | 2.1 |
| **Fecha** | 3 de junio de 2026 |

> **Cambio de stack (v2.1).** El proyecto pasa de un monolito **Laravel 13 + Livewire 4** a una arquitectura **desacoplada**: backend **API-only en CodeIgniter 4.7** + frontend **SPA en React 19 + Vite** ([ADR-006](02-arquitectura/ADR-006-cambio-stack-ci4-react.md)). **Firebase** provee identidad ([ADR-008](02-arquitectura/ADR-008-firebase-authentication.md)), chat (Firestore) y almacenamiento de archivos ([ADR-007](02-arquitectura/ADR-007-firebase-storage-imagenes.md)). El dominio (01), el modelo de datos (03) y el plan de seguridad (04) se conservan.

---

## Stack tecnológico (v2.1 — decidido)

| Capa | Tecnología | Versión (jun-2026) |
|---|---|---|
| Backend | **CodeIgniter** (API REST pura) | 4.7.x |
| Lenguaje | PHP | 8.3+ |
| Frontend | **React + Vite + TypeScript** | React 19 · Vite 6 |
| Estado cliente | TanStack Query (server) + Zustand (UI) | — |
| Estilos | Tailwind CSS 4 (tokens del design system) | 4.x |
| Auth | **Firebase Authentication** (email/contraseña, Google, Facebook, Microsoft); CI4 verifica el ID token | Firebase Admin SDK |
| Base de datos (fuente de verdad) | MySQL | 8.0+ |
| Tiempo real (chat) | Cloud Firestore | acotado a mensajería |
| Almacenamiento de archivos | Firebase Storage (imágenes públicas vía CDN; documentos de identidad en prefijo privado, cifrados app-side) | — |
| Caché, cola y throttle | Redis | — |
| Despliegue | VPS Linux (Nginx sirve SPA + proxy a API) | HTTPS forzado |

**Arquitectura:** cliente-servidor desacoplado. La SPA React consume una API REST JSON de CodeIgniter 4. Se mantiene la frontera explícita MySQL ↔ Firestore: MySQL es la única fuente de verdad para identidad, autorización y dominio transaccional; Firestore es un canal de chat autorizado por el backend, nunca una autoridad. **El cliente nunca es de fiar**: toda regla de negocio y autorización vive en CI4.

---

### Código fuente y arranque

El scaffolding del monorepo vive en [`app-codigo/`](app-codigo/): `apps/api` (CodeIgniter 4) y `apps/web` (React + Vite). Antes de codificar, lee **[`CLAUDE.md`](CLAUDE.md)** — es el punto de entrada con el stack, las reglas no negociables, los comandos y el orden de lectura.

---

## Índice de documentos

| # | Documento | Contenido |
|---|---|---|
| 01 | [SRS — Especificación de Requisitos](01-vision/01_SRS_especificacion_requisitos.md) | Requisitos funcionales y no funcionales, roles, máquina de estados, criterios de aceptación del MVP |
| 02 | [Arquitectura del Sistema (v2.1)](02-arquitectura/02_arquitectura_sistema.md) | Capas CI4+React, patrones, frontera MySQL↔Firestore, auth Firebase, despliegue, ADRs |
| 02b | [ADR-006 — Cambio de stack](02-arquitectura/ADR-006-cambio-stack-ci4-react.md) | Decisión CI4 + React/Vite, mapeo Laravel→CI4, implicaciones de seguridad |
| 02c | [ADR-007 — Firebase Storage para archivos](02-arquitectura/ADR-007-firebase-storage-imagenes.md) | Imágenes y documentos en Firebase Storage, subida directa con token acotado, salvaguardas de PII |
| 02d | [ADR-008 — Firebase Authentication](02-arquitectura/ADR-008-firebase-authentication.md) | Identidad por Firebase (email + Google/Facebook/Microsoft); CI4 verifica el ID token; elimina JWT propio |
| 03 | [Modelo de Datos](03-datos/03_modelo_de_datos.md) | ERD, diccionario, DDL MySQL completo (3NF), modelo Firestore |
| 04 | [Plan de Seguridad](04-seguridad/04_plan_de_seguridad.md) | OWASP Top 10, RBAC, cifrado, Security Rules, auditoría, LFPDPPP |
| 05 | [Especificación de la API](05-api/05_especificacion_api.md) | Endpoints REST, contratos, códigos, rate limiting, trazabilidad |
| 06 | [Plan de Pruebas](06-pruebas/06_plan_de_pruebas.md) | Estrategia, casos por módulo, pruebas de seguridad, CI, matriz de trazabilidad |
| 07 | [Roadmap por Sprints](07-roadmap/07_roadmap_sprints.md) | 8 sprints, hitos del MVP, riesgos, backlog v2 |
| 08 | [Identidad Visual y Design System](01-vision/08_identidad_visual_design_system.md) | Marca, paleta completa, tipografía, forma de componentes, tokens listos para Tailwind |

---

## Decisiones clave del MVP

| Tema | Decisión |
|---|---|
| Autenticación | Firebase Authentication (email/contraseña, Google, Facebook, Microsoft); CI4 verifica el ID token |
| Verificación de identidad | Manual por moderador (automatizada en v2) |
| Marcar "completada" | Doble confirmación (ambas partes) |
| Notificaciones | Solo correo (push en v2) |
| Administración | RBAC: Super-administrador + Moderador |
| Chat | Firestore acotado, autorizado por el backend contra MySQL |
| Archivos | Firebase Storage (imágenes públicas vía CDN; documentos de identidad privados, cifrados app-side) |

---

## Cómo leer esta documentación

1. Empieza por el **SRS (01)** para entender qué hace el sistema.
2. Sigue con la **Arquitectura (02)** y los **ADR (006/007/008)** para entender cómo se estructura y por qué.
3. El **Modelo de Datos (03)** y la **API (05)** son la referencia de implementación.
4. El **Plan de Seguridad (04)** es de lectura obligatoria antes de codificar cualquier flujo sensible.
5. El **Plan de Pruebas (06)** define la red de seguridad y el "Definición de Hecho".
6. El **Roadmap (07)** marca el orden seguro de construcción.

---

## Consistencia y trazabilidad

Cada requisito funcional del SRS se mapea a entidades del modelo de datos, endpoints de la API y casos de prueba. Las matrices de trazabilidad viven en los documentos 05 (§13) y 06 (§6). Los diagramas Mermaid de todos los documentos fueron validados sintácticamente.

---

## Próximos pasos sugeridos

- [ ] Confirmar nombre/marca definitiva de la plataforma.
- [ ] Validar la conformidad LFPDPPP con asesor legal.
- [ ] Provisionar el VPS de staging y el proyecto de Firebase (Auth + Firestore + Storage).
- [ ] Arrancar **Sprint 0 — Cimientos**.

---

*Documentación técnica de Banco de Tiempo · Plan Juárez · v2.1 · 3-jun-2026*
