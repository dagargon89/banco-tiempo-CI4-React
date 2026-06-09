import Button from '@/components/ui/Button';
import type { VinculacionCard } from '@/lib/types';
import {
  useAceptarVinculacion,
  useRechazarVinculacion,
  useCancelarVinculacion,
  useConfirmarVinculacion,
} from '../hooks/useVinculaciones';

interface AccionesVinculacionProps {
  vinculacion: VinculacionCard;
  userId: number;
}

export default function AccionesVinculacion({ vinculacion, userId }: AccionesVinculacionProps) {
  const aceptar = useAceptarVinculacion();
  const rechazar = useRechazarVinculacion();
  const cancelar = useCancelarVinculacion();
  const confirmar = useConfirmarVinculacion();

  const esOferente = userId === Number(vinculacion.oferente_id);
  const esBuscador = userId === Number(vinculacion.buscador_id);
  const isPending = aceptar.isPending || rechazar.isPending || cancelar.isPending || confirmar.isPending;

  const yaConfirmo = Boolean(Number(esOferente ? vinculacion.confirmado_oferente : vinculacion.confirmado_buscador));

  return (
    <div className="flex flex-wrap gap-2">
      {/* Oferente: aceptar/rechazar en estado solicitada */}
      {esOferente && vinculacion.estado === 'solicitada' && (
        <>
          <Button
            variant="primary"
            onClick={() => aceptar.mutate(vinculacion.id)}
            disabled={isPending}
          >
            Aceptar
          </Button>
          <Button
            variant="danger"
            onClick={() => rechazar.mutate(vinculacion.id)}
            disabled={isPending}
          >
            Rechazar
          </Button>
        </>
      )}

      {/* Ambos: cancelar en solicitada o aceptada */}
      {(esBuscador || esOferente) &&
        (vinculacion.estado === 'solicitada' || vinculacion.estado === 'aceptada') && (
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm('Cancelar esta vinculacion?')) {
                cancelar.mutate(vinculacion.id);
              }
            }}
            disabled={isPending}
          >
            Cancelar
          </Button>
        )}

      {/* Ambos: confirmar en aceptada */}
      {(esBuscador || esOferente) && vinculacion.estado === 'aceptada' && !yaConfirmo && (
        <Button
          variant="lime"
          onClick={() => confirmar.mutate(vinculacion.id)}
          disabled={isPending}
        >
          Confirmar prestacion
        </Button>
      )}
    </div>
  );
}
