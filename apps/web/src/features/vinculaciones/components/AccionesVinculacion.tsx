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
      onSuccess: () => toast.success('Vinculación aceptada. Ya pueden chatear.'),
      onError: (err) => toastError(err, 'Error al aceptar la vinculación.'),
    });

  const handleRechazar = () =>
    rechazar.mutate(vinculacion.id, {
      onSuccess: () => toast.info('Vinculación rechazada'),
      onError: (err) => toastError(err, 'Error al rechazar la vinculación.'),
    });

  const handleCancelar = () => {
    if (!confirm('Cancelar esta vinculacion?')) return;
    cancelar.mutate(vinculacion.id, {
      onSuccess: () => toast.info('Vinculación cancelada'),
      onError: (err) => toastError(err, 'Error al cancelar.'),
    });
  };

  const handleConfirmar = () =>
    confirmar.mutate(vinculacion.id, {
      onSuccess: () => toast.success('Prestación confirmada'),
      onError: (err) => toastError(err, 'Error al confirmar la prestación.'),
    });

  return (
    <div className="flex flex-wrap gap-2">
      {/* Oferente: aceptar/rechazar en estado solicitada */}
      {esOferente && vinculacion.estado === 'solicitada' && (
        <>
          <Button variant="primary" onClick={handleAceptar} disabled={isPending}>
            Aceptar
          </Button>
          <Button variant="danger" onClick={handleRechazar} disabled={isPending}>
            Rechazar
          </Button>
        </>
      )}

      {/* Ambos: cancelar en solicitada o aceptada */}
      {(esBuscador || esOferente) &&
        (vinculacion.estado === 'solicitada' || vinculacion.estado === 'aceptada') && (
          <Button variant="secondary" onClick={handleCancelar} disabled={isPending}>
            Cancelar
          </Button>
        )}

      {/* Ambos: confirmar en aceptada */}
      {(esBuscador || esOferente) && vinculacion.estado === 'aceptada' && !yaConfirmo && (
        <Button variant="lime" onClick={handleConfirmar} disabled={isPending}>
          Confirmar prestacion
        </Button>
      )}
    </div>
  );
}
