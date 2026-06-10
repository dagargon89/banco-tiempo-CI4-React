import DetailDrawer from '@/components/ui/DetailDrawer';
import Badge from '@/components/ui/Badge';
import UserName from '@/components/ui/UserName';
import { useOfertaDetalleAdmin } from '../hooks/useOfertaDetalleAdmin';

interface Props {
  ofertaId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function OfertaDetailDrawer({ ofertaId, open, onClose }: Props) {
  const { data: oferta, isLoading } = useOfertaDetalleAdmin(ofertaId);

  return (
    <DetailDrawer open={open} onClose={onClose} title="Detalle de oferta">
      {isLoading || !oferta ? (
        <p className="text-sm text-text-3">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text-1">{oferta.titulo}</h3>
            <p className="mt-1 text-sm text-text-2">{oferta.descripcion_breve}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant={oferta.estado === 'activa' ? 'success' : oferta.estado === 'pausada' ? 'warning' : 'neutral'}>{oferta.estado}</Badge>
            <Badge variant="info">{oferta.modalidad}</Badge>
            {Boolean(oferta.pausada_por_admin) && (
              <Badge variant="error">Pausada por baja del oferente</Badge>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <p className="text-text-3">Oferente</p>
            <p className="font-medium text-text-1">
              <UserName nombre={oferta.oferente_nombre} inactivo={Boolean(oferta.oferente_inactivo)} />
            </p>
          </div>

          {oferta.descripcion_completa && (
            <div>
              <h4 className="mb-1 text-sm font-semibold text-text-1">Descripción</h4>
              <p className="whitespace-pre-line text-sm text-text-2">{oferta.descripcion_completa}</p>
            </div>
          )}

          {oferta.zona && (
            <p className="text-sm text-text-2">Zona: <span className="text-text-1">{oferta.zona}</span></p>
          )}

          <p className="text-xs text-text-3">{oferta.vinculaciones_count} vinculación(es)</p>
        </div>
      )}
    </DetailDrawer>
  );
}
