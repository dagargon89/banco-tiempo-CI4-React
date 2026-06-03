# ADR-008 — Firebase Authentication como proveedor de identidad

| Campo | Valor |
|---|---|
| Estado | **Aceptado** |
| Fecha | 3 de junio de 2026 |
| Reemplaza | El esquema de auth de [ADR-006 §5](ADR-006-cambio-stack-ci4-react.md) (JWT propio + refresh token rotatorio) |
| Depende de | 02 — Arquitectura, 03 — Modelo de Datos, 04 — Seguridad, [ADR-006](ADR-006-cambio-stack-ci4-react.md), [ADR-007](ADR-007-firebase-storage-imagenes.md) |
| Decisor | Arquitectura & Full-Stack |

---

## 1. Contexto

La v2.0 (ADR-006) definió autenticación con **JWT de emisión propia** (CI4) más **refresh token rotatorio** en cookie. El proyecto ya usa Firebase para chat (Firestore) y almacenamiento (Storage). La dirección decide **delegar también la autenticación a Firebase Authentication**, soportando inicio de sesión con **email/contraseña** y **proveedores federados (Google, Facebook, Microsoft)** y dejando posible añadir otros.

Esto unifica la identidad en Firebase, elimina la necesidad de gestionar contraseñas, refresh tokens y verificación de correo en el backend, y reutiliza la misma identidad para el chat (Firestore) y la subida de archivos (Storage). CI4 deja de **emitir** identidad y pasa a **verificar** la identidad emitida por Firebase.

## 2. Decisión

1. **Firebase Authentication es el proveedor de identidad.** El SPA usa el SDK de Firebase Auth para iniciar sesión con:
   - **Email/contraseña** (gestionado por Firebase, con su verificación de correo).
   - **Google**, **Facebook**, **Microsoft** (OAuth federado vía Firebase).
   - Arquitectura abierta a añadir más proveedores sin tocar el backend.
2. **CI4 verifica el ID token de Firebase en cada petición.** El SPA envía el **Firebase ID token** (JWT corto que Firebase emite y refresca solo) en `Authorization: Bearer <idToken>`. Un filtro `auth-firebase` lo verifica con el **Admin SDK** (firma, expiración, `aud`, `iss`) y resuelve el usuario local.
3. **Se elimina el esquema de JWT propio + refresh** (ADR-006 §5): no hay `TokenService` de emisión, ni endpoints `/auth/login` `/auth/refresh` `/auth/logout` propios, ni tabla `refresh_tokens`. El refresco del token lo hace el SDK de Firebase en el cliente; CI4 nunca emite ni almacena tokens de sesión.
4. **Aprovisionamiento de usuario (Just-In-Time).** En la primera petición válida de un `firebase_uid` desconocido, CI4 crea la fila en `users` (mapeo `firebase_uid` → usuario local) tomando `nombre`/`email` del token. Endpoint `POST /auth/sync` para registro/login idempotente.
5. **Separación de "verificaciones".** Firebase aporta `email_verified` (verificación del **correo**). La **verificación de identidad** (documento INE revisado por moderador, RF-VER-*) **se conserva intacta**: son conceptos distintos. Solo usuarios con identidad `verificado` publican o marcan interés.
6. **RBAC sigue en MySQL.** Los roles administrativos (`super_admin`, `moderador`) viven en `roles`/`role_user`, no en Firebase. Opcionalmente se reflejan como *custom claims* de Firebase para reglas de Firestore/Storage, pero la autoridad es MySQL.

## 3. Flujo de autenticación

```mermaid
sequenceDiagram
    participant U as SPA React
    participant FA as Firebase Auth
    participant L as API CodeIgniter 4
    participant DB as MySQL

    U->>FA: signIn (email/contraseña | Google | Facebook | Microsoft)
    FA-->>U: ID token (JWT corto, auto-refrescado por el SDK)
    U->>L: POST /auth/sync  (Authorization: Bearer <idToken>)
    L->>FA: Admin SDK verifyIdToken(idToken)
    FA-->>L: claims {uid, email, email_verified, name, firebase.sign_in_provider}
    L->>DB: ¿existe user con firebase_uid? → si no, crear (JIT)
    DB-->>L: usuario local (id, roles, estado_verificacion)
    L-->>U: perfil local + roles + estado de verificación
    Note over U,L: en cada petición siguiente el SPA manda el ID token;<br/>el filtro auth-firebase lo verifica y resuelve el usuario
    U->>FA: el SDK refresca el ID token automáticamente al expirar
```

## 4. Consecuencias

### Positivas
- **Una sola identidad** para API, chat (Firestore) y archivos (Storage): el mismo `uid` y los mismos *custom claims*.
- **Sin gestión de contraseñas ni refresh tokens en el backend**: menos superficie de ataque y menos código sensible (se elimina `TokenService` y `refresh_tokens`).
- **Proveedores federados "gratis"** (Google, Facebook, Microsoft) y verificación de correo delegada a Firebase.
- **Refresco transparente**: el SDK de Firebase mantiene el ID token fresco; el SPA no implementa lógica de refresh.

### Negativas / Riesgos
- **Dependencia de Firebase para iniciar sesión** (disponibilidad). Asumida; ya somos dependientes para chat y archivos.
- **Verificación de token en cada request.** El Admin SDK cachea las claves públicas de Google; el coste es bajo. Se puede memorizar el resultado de `verifyIdToken` por la vida del token para evitar reverificar en ráfagas.
- **Revocación de sesión** ya no es local: para forzar cierre de sesión se usa `revokeRefreshTokens(uid)` del Admin SDK + verificación con `checkRevoked=true` en endpoints sensibles.
- **Mapeo y deduplicado de cuentas:** un mismo correo en dos proveedores. Se habilita "account linking" de Firebase y se usa el `email` verificado como clave de unificación cuando aplique.

## 5. Implicaciones de seguridad (addendum, sustituye ADR-006 §5)

1. **A07 — Auth.** La identidad la emite y refresca Firebase. CI4 **verifica** el ID token (firma RS256 con claves públicas de Google, `exp`, `aud`=projectId, `iss`). Endpoints sensibles verifican con `checkRevoked=true`.
2. **A02 — Cripto.** Ya no se hashean contraseñas en MySQL (Firebase las custodia). Desaparece `password_hash` de `users`. El secreto compartido `JWT_SECRET` propio se elimina.
3. **A01 — Access Control.** RBAC permanece en MySQL (filtros `rbac:` + PolicyServices). El `firebase_uid` del token verificado es la identidad; la autorización de objeto no cambia.
4. **CSRF.** Al usar `Authorization: Bearer <idToken>` (no cookies) para todas las peticiones, el CSRF clásico no aplica. Se elimina la cookie de refresh y su protección específica.
5. **Verificación de correo e identidad.** `email_verified` (Firebase) ≠ identidad `verificado` (documento + moderador). Solo verificados de identidad acceden a publicar/contactar.
6. **Chat y Storage.** Los Custom Tokens acotados (chat) y los tokens de subida (Storage) se siguen emitiendo desde CI4, ahora ligados al `firebase_uid` ya autenticado. Coherente con ADR-006 §5 (chat) y ADR-007.

## 6. Alternativas descartadas

| Alternativa | Por qué se descartó |
|---|---|
| Mantener JWT propio + refresh (ADR-006 §5) | Duplica lo que Firebase ya ofrece; obliga a custodiar contraseñas y refresh tokens. La dirección decide unificar en Firebase. |
| Sesión propia de CI4 tras login Firebase | Reintroduce gestión de sesión/cookies y CSRF; se prefiere verificar el ID token por petición (stateless). |
| Solo proveedores federados (sin email/contraseña) | Excluye a usuarios sin cuenta Google/Facebook/Microsoft; se incluye email/contraseña de Firebase. |

---

*ADR-008 · Banco de Tiempo · Plan Juárez · v2.0 · 3-jun-2026. Sustituye el esquema de autenticación de ADR-006 §5. Los documentos 01, 02, 03, 04 y 05 se actualizan en consecuencia.*
