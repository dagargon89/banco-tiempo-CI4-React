import Button from '@/components/ui/Button';
import { toast, toastError } from '@/lib/toast';
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

  const handleAceptar = () =>
    aceptar.mutate(vinculacion.id, {
      onSuccess: () => toast.success('Aceptado. Ya pueden hablar por mensaje.'),
      onError: (err) => toastError(err, 'No se pudo aceptar.'),
    });

  const handleRechazar = () =>
    rechazar.mutate(vinculacion.id, {
      onSuccess: () => toast.info('Solicitud rechazada'),
      onError: (err) => toastError(err, 'No se pudo rechazar.'),
    });

  const handleCancelar = () => {
    if (!confirm('¿Cancelar este intercambio? La otra persona verá que lo cancelaste.')) return;
    cancelar.mutate(vinculacion.id, {
      onSuccess: () => toast.info('Intercambio cancelado'),
      onError: (err) => toastError(err, 'No se pudo cancelar.'),
    });
  };

  const handleConfirmar = () =>
    confirmar.mutate(vinculacion.id, {
      onSuccess: () => toast.success('Confirmaste que se dio el intercambio'),
      onError: (err) => toastError(err, 'No se pudo confirmar.'),
    });

  return (
    <div className="flex flex-wrap gap-2">
      {/* Oferente: aceptar/rechazar en estado solicitada */}
      {esOferente && vinculacion.estado === 'solicitada' && (
        <>
          <Button variant="primary" onClick={handleAceptar} disabled={isPending}>
            Aceptar
          </Button>
          <Button variant="danger-subtle" onClick={handleRechazar} disabled={isPending}>
            Rechazar
          </Button>
        </>
      )}

      {/* Ambos: confirmar en aceptada */}
      {(esBuscador || esOferente) && vinculacion.estado === 'aceptada' && !yaConfirmo && (
        <Button onClick={handleConfirmar} disabled={isPending}>
          Confirmar que se dio
        </Button>
      )}
      {/* Ambos: cancelar en solicitada o aceptada */}
      {(esBuscador || esOferente) &&
        (vinculacion.estado === 'solicitada' || vinculacion.estado === 'aceptada') && (
          <Button variant="danger-subtle" onClick={handleCancelar} disabled={isPending}>
            Cancelar intercambio
          </Button>
        )}

    </div>
  );
}
