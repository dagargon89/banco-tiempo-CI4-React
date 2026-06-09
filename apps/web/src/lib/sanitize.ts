/**
 * Sanitización de contenido HTML generado por el usuario (SEC-04).
 *
 * React escapa automáticamente todo contenido renderizado vía JSX,
 * por lo que NO es necesario llamar estas funciones para texto plano.
 *
 * Usar SOLO cuando se necesite renderizar HTML enriquecido con
 * `dangerouslySetInnerHTML` (p. ej. Markdown renderizado, contenido
 * formateado por editores WYSIWYG, etc.).
 *
 * @example
 * // Renderizar HTML sanitizado (único caso válido para dangerouslySetInnerHTML)
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownRendered) }} />
 */
import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML permitiendo solo etiquetas seguras (texto formateado).
 * Elimina `<script>`, `onerror`, `onclick`, `javascript:`, etc.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Elimina TODO el HTML y devuelve solo texto plano.
 * Útil para contextos donde no se necesita formato.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
