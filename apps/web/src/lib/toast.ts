import { toast } from 'sonner';

/**
 * Extrae el mensaje de error más informativo de una respuesta de la API.
 * El backend (CI4) devuelve errores en `errors.validation` o `message`.
 */
export function extractErrorMessage(err: unknown, fallback = 'Ocurrió un error. Intenta de nuevo.'): string {
  if (!err || typeof err !== 'object') return fallback;
  const anyErr = err as { response?: { data?: { errors?: { validation?: string }; message?: string } }; message?: string };
  return (
    anyErr.response?.data?.errors?.validation ??
    anyErr.response?.data?.message ??
    anyErr.message ??
    fallback
  );
}

/**
 * Muestra un toast de error extrayendo el mensaje de la respuesta de la API.
 */
export function toastError(err: unknown, fallback = 'Ocurrió un error. Intenta de nuevo.') {
  toast.error(extractErrorMessage(err, fallback));
}

export { toast };
