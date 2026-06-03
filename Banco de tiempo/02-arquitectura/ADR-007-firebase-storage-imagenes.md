# ADR-007 — Firebase Storage para imágenes y documentos

| Campo | Valor |
|---|---|
| Estado | **Aceptado** |
| Fecha | 3 de junio de 2026 |
| Depende de | 02 — Arquitectura, 03 — Modelo de Datos, 04 — Seguridad, [ADR-006](ADR-006-cambio-stack-ci4-react.md) |
| Decisor | Arquitectura & Full-Stack |

---

## 1. Contexto

La v2.0 ya usa Firebase (Firestore) para el chat. Hasta ahora, el almacenamiento de archivos estaba dividido: las imágenes públicas (galería de ofertas, foto de perfil) en un disco/CDN, y los **documentos de identidad** en un disco privado cifrado fuera del docroot (doc 04 §4). La dirección decide **unificar todo el almacenamiento de archivos en Firebase Storage**, incluidos los documentos de identidad, y que el **SPA suba los archivos directamente** a Storage en vez de pasarlos por la API.

Esto reduce infraestructura propia (un solo proveedor de blobs, CDN incluida) y descarga al servidor del tránsito de binarios. Pero los documentos de identidad son **PII crítica** (doc 04 §1.1): mover ese activo a un servicio externo exige salvaguardas explícitas para no degradar la postura de seguridad ni la conformidad LFPDPPP.

## 2. Decisión

1. **Firebase Storage es el almacén de todos los archivos** de la plataforma: imágenes de oferta, fotos de perfil y documentos de identidad.
2. **Subida directa desde el SPA con autorización acotada emitida por CI4.** El binario no pasa por la API. El flujo es:
   - El SPA pide a CI4 autorización para subir (indicando tipo de archivo y destino).
   - CI4 valida (tipo, tamaño previsto, estado del usuario, cuota) y emite un **Custom Token de Firebase con claims acotados** (o una URL de subida firmada de corta expiración) limitado a una ruta concreta del bucket.
   - El SPA sube directo a Firebase Storage usando ese token.
   - El SPA notifica a CI4 la ruta resultante; CI4 la **persiste en MySQL** (`ofertas`, `users.foto_perfil`, `documentos_verificacion.ruta_cifrada`) y, para documentos de identidad, registra el evento en `auditoria`.
3. **Dos buckets (o dos prefijos con reglas distintas):**
   - `publico/` — imágenes de oferta y perfil. Lectura pública (CDN), escritura solo con token acotado del propietario.
   - `privado/` — documentos de identidad. **Sin lectura pública**; descarga solo mediante URL firmada efímera generada por CI4 para un moderador autorizado.
4. **Cifrado del lado de la aplicación para documentos de identidad.** El binario del documento se **cifra en el cliente/servidor antes de subirse** (el contenido en Storage es opaco). La clave vive en CI4 (`.env`), nunca en el SPA ni en Storage. Firebase nunca ve el documento en claro. Defensa en profundidad sobre el cifrado en reposo del propio Storage.

## 3. Consecuencias

### Positivas
- **Un solo proveedor de almacenamiento** y CDN para imágenes públicas → menos infraestructura propia, mejor latencia de servido.
- **Servidor descargado del tránsito de binarios**: la subida directa no consume ancho de banda ni memoria de PHP-FPM.
- Mismo patrón de autorización ya probado para el chat (CI4 emite token acotado, las Security Rules son segunda barrera).

### Negativas / Riesgos
- **PII de identidad en un servicio externo (riesgo crítico).** Mitigación: cifrado app-side previo a la subida (Storage solo guarda opaco), bucket privado deny-by-default, descarga solo por URL firmada efímera para moderador, auditoría de cada acceso, y política de retención/borrado (doc 04 §5, doc 03 §6).
- **Configuración de Storage es ahora superficie de ataque.** Una regla mal puesta expondría archivos. Mitigación: Security Rules versionadas, probadas en emulador y revisadas en el checklist de pre-producción.
- **Validación server-side del binario se debilita** (CI4 no ve el archivo en subida directa). Mitigación: CI4 valida *metadatos declarados* (tipo MIME, tamaño) antes de emitir el token, las Security Rules de Storage imponen límites de tamaño y `contentType`, y un Command/trigger posverificación puede revalidar el objeto subido.
- **Dependencia operativa de Firebase** también para archivos (no solo chat). Asumida y acotada.

## 4. Implicaciones de seguridad (addendum al documento 04)

El documento 04 §4 (manejo de documentos de identidad) se reescribe para el flujo de Storage; sus invariantes se conservan y se refuerzan:

1. El documento de identidad **se cifra antes de subirse**; Firebase Storage solo almacena el blob cifrado.
2. El bucket/prefijo privado es **deny-by-default**: ninguna lectura pública; ni siquiera el propietario lee su propio documento tras subirlo.
3. La descarga la realiza **CI4 con el Admin SDK** (o emite una URL firmada efímera), **solo** para un moderador autorizado, descifrando en memoria, y **registra el acceso en `auditoria`**.
4. Las imágenes públicas (oferta/perfil) **no** llevan PII sensible y pueden servirse por CDN, pero su escritura sigue exigiendo token acotado al propietario.
5. Las Security Rules de Storage imponen: `request.auth` válido, ruta == claim del token, `contentType` en lista blanca, y `size` máximo.
6. Política de retención: los documentos de identidad se eliminan/anonimizan del bucket privado al cumplir su finalidad o al dar de baja la cuenta (doc 03 §6, LFPDPPP).

## 5. Alternativas descartadas

| Alternativa | Por qué se descartó |
|---|---|
| Documentos de identidad en disco privado cifrado del VPS (v2.0 previa) | La dirección decide unificar en Firebase; se conserva el cifrado app-side para no perder garantías. |
| Subida vía API (CI4 como proxy de todos los archivos) | Carga el servidor con el tránsito de binarios; se eligió subida directa con token acotado. Se mantiene como *fallback* si la subida directa fallara para un caso. |
| Un solo bucket para todo | Mezcla PII crítica con contenido público bajo las mismas reglas; se separan prefijos/buckets con reglas distintas. |

---

*ADR-007 · Banco de Tiempo · Plan Juárez · v2.0 · 3-jun-2026. Refuerza el documento 04 §4 y actualiza el reparto de almacenamiento de los documentos 02 y 03.*
