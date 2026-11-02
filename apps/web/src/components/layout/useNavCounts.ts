import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';

/**
 * Cifras que el menú muestra junto a cada sección. Solo cuenta lo que pide
 * una acción: solicitudes que esperan tu respuesta.
 */
export function useNavCounts(): Record<string, number> {
  const verificado = useAuthStore((s) => s.user?.estado_verificacion === 'verificado');
  const { data } = useListarVinculaciones(
    { estado: 'solicitada', rol: 'oferente', per_page: 1 },
    { enabled: verificado },
  );
  return { '/ensenando': data?.meta.total ?? 0 };
}
