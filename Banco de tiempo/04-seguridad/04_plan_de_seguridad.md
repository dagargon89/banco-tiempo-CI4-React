# Plan de Seguridad
## Banco de Tiempo · Plataforma de Voluntariado de Habilidades

| Campo | Valor |
|---|---|
| Documento | 04 — Plan de Seguridad (Security by Design) |
| Versión | 2.1 (Firebase Auth + Firebase Storage — ADR-006/007/008) |
| Fecha | 3 de junio de 2026 |
| Marco de referencia | OWASP Top 10 (2021), OWASP ASVS, LFPDPPP |
| Depende de | 01 — SRS, 02 — Arquitectura, 03 — Modelo de Datos, [ADR-006](../02-arquitectura/ADR-006-cambio-stack-ci4-react.md), [ADR-007](../02-arquitectura/ADR-007-firebase-storage-imagenes.md), [ADR-008](../02-arquitectura/ADR-008-firebase-authentication.md) |

> **v2.1.** El modelo de amenazas, los activos y la postura de seguridad **no cambian**. Los controles se expresan para el stack CodeIgniter 4 + React con **Firebase como proveedor de identidad (Auth), chat (Firestore) y archivos (Storage)**. La autenticación con JWT propio + refresh de ADR-006 §5 queda **sustituida** por verificación del ID token de Firebase ([ADR-008](../02-arquitectura/ADR-008-firebase-authentication.md)); el almacenamiento de archivos sigue [ADR-007](../02-arquitectura/ADR-007-firebase-storage-imagenes.md).

---

## 1. Postura de seguridad

La plataforma maneja datos personales sensibles (documentos de identidad, conversaciones privadas, datos de contacto) de personas reales en Ciudad Juárez. La seguridad no es una capa añadida al final: es un criterio de diseño en cada decisión. Este documento define el modelo de amenazas, los controles por cada riesgo de OWASP Top 10, y los procedimientos operativos de seguridad.

### 1.1 Activos a proteger (por criticidad)

| Activo | Criticidad | Por qué |
|---|---|---|
| Documentos de identidad | Crítica | PII sensible; su filtración causa daño directo e irreversible |
| Credenciales de usuario | Crítica | Acceso a cuentas; reutilización entre servicios |
| Conversaciones de chat | Alta | Privacidad; pueden contener datos de contacto y ubicación |
| Datos de contacto y ubicación (zona) | Alta | Riesgo físico para personas si se exponen |
| Sesiones administrativas | Crítica | Control total de la plataforma |
| Integridad de vinculaciones y reseñas | Media | Confianza del sistema |

### 1.2 Actores de amenaza considerados

Usuario malicioso autenticado, atacante externo no autenticado, usuario que intenta escalar privilegios, scraper masivo de ofertas/PII, y compromiso de credenciales de un moderador.

---

## 2. OWASP Top 10 — Controles aplicados

### A01:2021 — Broken Access Control (Control de acceso roto)

**Riesgo:** que un usuario acceda a recursos o acciones que no le corresponden (ver documentos de otro, leer chats ajenos, ejecutar acciones de admin).

**Controles:**

- **RBAC con Filters y PolicyServices de CI4.** El filtro `rbac:` corta por rol a nivel de ruta; cada acción sensible pasa además por un `PolicyService` invocado explícitamente. Ejemplo: `VinculacionPolicyService::puedeVerChat()` autoriza solo si el usuario es parte de la vinculación y su estado es `aceptada`/`completada`.
- **Autorización a nivel de objeto, no solo de ruta.** No basta con "tiene JWT válido"; se verifica la propiedad del recurso concreto (`oferta.user_id === $request->userId`).
- **Principio de menor privilegio.** Moderador ≠ Super-administrador. El moderador no puede crear/revocar admins ni tocar categorías (filtro `rbac:super_admin`).
- **Denegación por defecto.** Los PolicyServices devuelven `false` salvo permiso explícito; los filtros deniegan si falta el rol.
- **IDs no adivinables en superficies sensibles.** Se evita exponer secuenciales donde un IDOR sería grave; se valida propiedad en cada acceso aunque el ID sea conocido.
- **Acceso a documentos y chat solo vía backend.** Nunca rutas públicas directas a storage; nunca credenciales Firebase amplias en cliente.

```php
// app/Services/Policies/VinculacionPolicyService.php — autorización de objeto (CI4)
public function puedeVerChat(int $userId, array $vinculacion): bool
{
    return in_array($vinculacion['estado'], ['aceptada', 'completada'], true)
        && ($userId === (int) $vinculacion['buscador_id']
            || $userId === (int) $vinculacion['oferente_id']);
}
```

### A02:2021 — Cryptographic Failures (Fallos criptográficos)

**Controles:**

- **Credenciales custodiadas por Firebase Authentication (ADR-008).** La plataforma **no almacena contraseñas** en MySQL (no hay `password_hash`): el hashing y la custodia de credenciales los hace Firebase. Esto reduce la superficie criptográfica del backend.
- **TLS forzado (HTTPS) con HSTS.** `app.forceGlobalSecureRequests=true` en producción; `Strict-Transport-Security` con `max-age` largo e `includeSubDomains` (filtro `secureheaders`).
- **Verificación del ID token de Firebase** (firma RS256 con claves públicas de Google) en cada petición; CI4 no firma ni custodia secretos de sesión propios (se elimina el `JWT_SECRET` del esquema anterior).
- **Cifrado app-side de documentos de identidad (ADR-007).** El binario se cifra **antes de subirse** a Firebase Storage (bucket privado); Storage solo guarda el blob opaco. La clave vive en CI4 (`.env`), nunca en el SPA ni en Storage.
- **`service('encrypter')->encrypt()`** de CI4 para cifrar el documento antes de la subida y para cualquier campo sensible reversible.
- **Sin secretos en el código.** Claves, tokens y credenciales en `.env` (excluido de git) y en archivo de credenciales Firebase Admin con permisos `0600`.

```php
// Documento de identidad: cifrado app-side + subida directa a Firebase Storage (ADR-007)
$encrypter = service('encrypter');

// 1) CI4 cifra el contenido (Storage nunca ve el documento en claro).
$blobCifrado = $encrypter->encrypt($contenidoBinario);

// 2) Se sube al bucket PRIVADO en una ruta acotada al usuario.
$ruta = "privado/identidad/{$userId}/" . bin2hex(random_bytes(16)) . '.enc';
$bucket = service('firebaseStorage')->getBucket();          // Admin SDK
$bucket->upload($blobCifrado, ['name' => $ruta]);

// 3) En BD se guarda solo la ruta; jamás el binario (documentos_verificacion.ruta_cifrada).
// La descarga para revisión la hace CI4 con el Admin SDK, descifra en memoria,
// emite URL firmada efímera y registra el acceso en `auditoria`.
```

> En subida directa desde el SPA, CI4 emite un token de Storage acotado a `privado/identidad/{uid}` y el cifrado ocurre con la clave que la app entrega para esa operación; el patrón anterior (CI4 como proxy) queda como *fallback*. En ambos casos el blob en Storage es opaco.

### A03:2021 — Injection (Inyección)

**Controles:**

- **Sentencias preparadas siempre.** Todo acceso vía Model / Query Builder de CI4 con binding de parámetros. **Cero** concatenación de variables en SQL crudo.
- **Si un raw query es inevitable**, se usa binding explícito: `$db->query('... WHERE x = ?', [$x])`.
- **Sanitización de salida contra XSS** (A03 cubre XSS en OWASP 2021): **React auto-escapa** todo lo renderizado en JSX. El uso de `dangerouslySetInnerHTML` está **prohibido** salvo contenido previamente purificado con lista blanca (DOMPurify). La API, al devolver solo JSON, no renderiza HTML.
- **Validación estricta de entrada** vía Validation rules de CI4 (en controlador o servicio) y `$allowedFields` en cada Model; rechazo de lo no esperado en lugar de "limpiar".

```php
// ❌ NUNCA
$db->query("SELECT * FROM ofertas WHERE titulo = '$titulo'");
// ✅ SIEMPRE — Query Builder con binding automático
$db->table('ofertas')->where('titulo', $titulo)->get();
// ✅ binding explícito en raw query
$db->query('SELECT * FROM ofertas WHERE titulo = ?', [$titulo]);
```

### A04:2021 — Insecure Design (Diseño inseguro)

**Controles:**

- **Máquina de estados de la vinculación** validada en el Service: imposible "completar" sin pasar por "aceptada" ni habilitar chat en estado inválido.
- **Modelado de abuso:** la regla de doble confirmación previene que una sola parte fuerce reseñas. La unicidad de solicitud previene spam de interés.
- **Límites de negocio:** capacidad máxima de oferta validada; throttling de creación de ofertas y tickets.
- Este documento, el SRS y la arquitectura constituyen el ejercicio de diseño seguro previo a codificar.

### A05:2021 — Security Misconfiguration (Configuración incorrecta)

**Controles:**

- `CI_ENVIRONMENT=production` y debug toolbar desactivado; páginas de error genéricas sin stack traces.
- Cabeceras de seguridad: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS.
- Servicios (MySQL, Redis) bind a `localhost`; nunca expuestos a internet. Redis con `requirepass`.
- PHP-FPM bajo usuario sin privilegios; `open_basedir` acotado al proyecto.
- Eliminación de rutas y endpoints de depuración antes de producción.
- Dependencias auditadas (`composer audit`, `npm audit`) en CI.

### A06:2021 — Vulnerable and Outdated Components (Componentes vulnerables)

**Controles:**

- Versiones vigentes: CodeIgniter 4.7, PHP 8.3, React 19, Vite 6 (junio 2026).
- `composer audit` y `npm audit` integrados en el pipeline; build falla ante vulnerabilidad alta/crítica.
- Política de actualización: parches de seguridad aplicados en ventana corta; revisión mensual de dependencias.

### A07:2021 — Identification and Authentication Failures

**Controles:**

- **Identidad delegada a Firebase Authentication (ADR-008).** Inicio de sesión con email/contraseña o proveedores federados (Google, Facebook, Microsoft). El login, el throttling de credenciales, la política de contraseñas, la verificación de correo y la recuperación los gestiona Firebase con sus controles.
- **Verificación del ID token en cada petición.** CI4 valida firma (RS256, claves públicas de Google), `exp`, `aud`=projectId, `iss`; endpoints sensibles usan `checkRevoked=true`.
- **Revocación de sesión** vía `revokeRefreshTokens(uid)` del Admin SDK (p. ej. al suspender una cuenta); no hay sesión local que invalidar.
- **2FA recomendado y exigible para administradores** (MFA de Firebase).
- **Verificación de correo (`email_verified` de Firebase) ≠ verificación de identidad** (documento + moderador). Solo los verificados de identidad publican o contactan.
- **Sin tokens de sesión propios:** se elimina el esquema JWT+refresh de ADR-006 §5. Al usar `Authorization: Bearer <idToken>` (no cookies), el CSRF clásico no aplica.

### A08:2021 — Software and Data Integrity Failures

**Controles:**

- Dependencias instaladas con lockfiles (`composer.lock`, `package-lock.json`) verificados.
- Migraciones versionadas y reversibles; ningún cambio de esquema manual en producción.
- Validación de integridad de los datos espejo en Firestore (`vinculacion_id`, `participantes`) escritos solo por el backend.

### A09:2021 — Security Logging and Monitoring Failures

**Controles:**

- **Tabla `auditoria` append-only** para acciones sensibles: verificaciones aprobadas/rechazadas, suspensión de cuentas, despublicación de ofertas, y **todo acceso de un moderador al chat bajo reporte** (quién, cuándo, qué conversación).
- Logs de aplicación sin PII ni secretos (nunca registrar contraseñas, tokens ni contenido de documentos).
- Monitoreo de errores y alertas ante picos de fallos de autenticación o autorización.
- Retención de logs conforme a la política.

### A10:2021 — Server-Side Request Forgery (SSRF)

**Controles:**

- El MVP no obtiene URLs arbitrarias provistas por el usuario. Si en v2 se integran servicios de verificación externos, las llamadas salientes irán a allowlist de dominios; sin reflejar entrada del usuario en la URL de destino.

---

## 3. Seguridad del módulo de chat (MySQL ↔ Firestore)

Este es el punto de mayor superficie de ataque por cruzar un límite de confianza hacia un servicio externo. Defensa en profundidad en tres capas:

### Capa 1 — Autorización en el backend (autoridad)
El backend solo emite un Custom Token de Firebase tras verificar en MySQL que (a) la vinculación está `aceptada`/`completada` y (b) el solicitante es parte. El token lleva el claim `conversation_id`.

### Capa 2 — Security Rules de Firestore (defensa en profundidad)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversaciones/{convId} {
      // Solo lectura/escritura si el usuario es participante
      // y su token está acotado a ESTA conversación.
      allow read: if request.auth != null
                  && request.auth.uid in resource.data.participantes
                  && request.auth.token.conversation_id == convId;

      // Los metadatos (participantes, vinculacion_id) NO se editan desde el cliente.
      allow write: if false;

      match /mensajes/{msgId} {
        allow read: if request.auth != null
                    && request.auth.uid in get(/databases/$(database)/documents/conversaciones/$(convId)).data.participantes
                    && request.auth.token.conversation_id == convId;

        allow create: if request.auth != null
                      && request.auth.token.conversation_id == convId
                      && request.resource.data.autor_uid == request.auth.uid
                      && request.resource.data.texto is string
                      && request.resource.data.texto.size() <= 2000;

        allow update, delete: if false; // mensajes inmutables
      }
    }
  }
}
```

### Capa 3 — Auditoría
El acceso administrativo a un chat (solo bajo reporte activo) se hace con el Admin SDK desde el backend y se registra en `auditoria`. El moderador nunca obtiene un token de cliente para el chat de otros.

---

## 3-bis. Seguridad del almacenamiento de archivos (Firebase Storage · ADR-007)

Todos los archivos (imágenes de oferta/perfil y documentos de identidad) viven en Firebase Storage con **subida directa desde el SPA** autorizada por un token acotado de CI4. La superficie de ataque clave es la configuración de las Security Rules de Storage; se aplica el mismo principio de defensa en profundidad que el chat.

**Reparto en dos prefijos con reglas distintas:**

| Prefijo | Contenido | Lectura | Escritura |
|---|---|---|---|
| `publico/{uid}/...` | Imágenes de oferta y perfil (sin PII sensible) | Pública (CDN) | Solo el propietario, con token acotado y límites de tipo/tamaño |
| `privado/identidad/{uid}/...` | Documentos de identidad (cifrados app-side) | **Denegada** a clientes; solo Admin SDK desde CI4 | Solo el propietario, con token acotado; objeto cifrado |

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Imágenes públicas: lectura libre, escritura del propietario con límites.
    match /publico/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024            // 5 MB
                   && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }

    // Documentos de identidad: NADIE lee desde cliente (solo Admin SDK del backend).
    // Escritura solo del propietario, con token acotado a su ruta y tope de tamaño.
    match /privado/identidad/{uid}/{allPaths=**} {
      allow read: if false;
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.auth.token.upload_scope == 'identidad'
                   && request.resource.size < 10 * 1024 * 1024;          // 10 MB
    }

    // Deny-by-default para cualquier otra ruta.
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Notas:** el `contentType` del documento de identidad no se restringe a imagen porque el binario va **cifrado** (su tipo aparente es opaco); el control real es el cifrado app-side + `read: if false`. CI4 valida los metadatos declarados antes de emitir el token y, opcionalmente, un Command posverificación revalida el objeto subido. Las reglas se versionan, se prueban en el emulador y se revisan en el checklist de pre-producción.

---

## 4. Manejo de documentos de identidad (flujo seguro · Firebase Storage)

> **v2.0 (ADR-007).** Los documentos de identidad se almacenan en el **bucket privado de Firebase Storage**, cifrados del lado de la aplicación antes de subirse. El binario sube **directo desde el SPA** con un token acotado emitido por CI4; CI4 nunca transporta el binario, pero sí lo cifra/descifra a través de la clave que custodia y autoriza cada acceso.

```mermaid
sequenceDiagram
    participant U as SPA (usuario)
    participant L as API CodeIgniter 4
    participant FS as Firebase Storage (bucket privado)
    participant M as Moderador (SPA)
    U->>L: Solicita subir documento (tipo, tamaño)
    L->>L: Valida metadatos + estado del usuario
    L->>U: Token/URL de subida acotado a ruta privada (efímero)
    U->>U: Cifra el binario con la clave entregada por la app (app-side)
    U->>FS: Sube el blob CIFRADO directo (Storage solo ve opaco)
    U->>L: Notifica la ruta resultante
    L->>L: Persiste ruta en BD; estado 'pendiente'
    M->>L: Solicita revisar documento de #U
    L->>L: Verifica rol moderador (PolicyService)
    L->>FS: Descarga el blob cifrado (Admin SDK)
    L->>L: Descifra en memoria + registra acceso en auditoria
    L-->>M: URL firmada efímera al contenido (expira en minutos)
    M->>L: Aprueba / rechaza (con motivo)
    L->>U: Notifica por correo
```

**Reglas (invariantes que se conservan y refuerzan):**

- El binario **se cifra app-side antes de subirse**: Firebase Storage solo almacena un blob opaco; nunca ve el documento en claro.
- El bucket/prefijo privado es **deny-by-default**: ninguna lectura pública; ni el propio usuario lee su documento tras subirlo.
- El acceso de revisión lo realiza **CI4 con el Admin SDK**, solo para un moderador autorizado, descifrando en memoria y emitiendo una URL firmada de expiración corta. Cada acceso deja rastro en `auditoria`.
- La ruta (no el binario) es lo único que vive en MySQL (`documentos_verificacion.ruta_cifrada`).
- Política de retención: el blob se elimina/anonimiza del bucket al cumplir su finalidad o al dar de baja la cuenta (doc 03 §6, LFPDPPP).

---

## 5. Protección de datos personales (LFPDPPP)

- **Aviso de privacidad** claro en el registro, con finalidad del tratamiento.
- **Minimización:** se recolecta solo lo necesario para el servicio.
- **Derechos ARCO:** el usuario puede solicitar acceso, rectificación, cancelación y oposición; la baja de cuenta dispara la eliminación/anonimización de datos personales —incluidos los blobs de identidad en Firebase Storage— salvo retención legal.
- **Retención limitada** de documentos de identidad (sección 6 del documento 03): el blob cifrado se purga del bucket privado al cumplir su finalidad de verificación.

> La conformidad jurídica final con la LFPDPPP debe validarse con un asesor legal. Este documento define controles técnicos, no constituye asesoría jurídica.

---

## 6. Checklist de seguridad pre-producción

- [ ] `CI_ENVIRONMENT=production`; debug toolbar desactivado; errores genéricos sin stack trace.
- [ ] HTTPS forzado + HSTS verificado.
- [ ] Cabeceras de seguridad (CSP, X-Frame-Options, nosniff) activas (filtro `secureheaders`).
- [ ] Firebase Authentication configurado: proveedores email/contraseña, Google, Facebook y Microsoft habilitados y probados.
- [ ] Verificación del ID token (Admin SDK) en el filtro `auth-firebase`; endpoints sensibles con `checkRevoked=true`.
- [ ] Aprovisionamiento JIT probado (mapeo `firebase_uid` → usuario local); deduplicado de cuentas por correo verificado.
- [ ] Sin `password_hash` ni `JWT_SECRET` propios en el backend (credenciales solo en Firebase).
- [ ] Throttling de endpoints sensibles configurado (`Throttler`).
- [ ] 2FA/MFA habilitado para todos los administradores.
- [ ] MySQL y Redis bind a localhost; Redis con contraseña.
- [ ] **Firebase Storage: buckets/prefijos separados (`publico/` vs `privado/`); reglas deny-by-default desplegadas y probadas en emulador.**
- [ ] **Documentos de identidad cifrados app-side antes de subir; el bucket privado no permite lectura de cliente (`read: if false`).**
- [ ] **Descarga de documentos solo vía Admin SDK / URL firmada efímera para moderador, con registro en `auditoria`.**
- [ ] Security Rules de Firestore desplegadas y probadas (deny por defecto).
- [ ] `composer audit` y `npm audit` sin hallazgos altos/críticos.
- [ ] Tabla de auditoría operativa y probada para acciones sensibles (incl. acceso a documentos y a chat bajo reporte).
- [ ] Backups cifrados y restauración probada.
- [ ] Secretos fuera del repositorio; `.env` y credenciales Firebase Admin con permisos restringidos (`0600`).
- [ ] Revisión de seguridad (documento 06) ejecutada sobre los flujos críticos.

---

*Documento 04 de la documentación técnica de Banco de Tiempo · Plan Juárez · v2.1 · 3-jun-2026*
