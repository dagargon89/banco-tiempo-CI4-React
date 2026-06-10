import { useState } from 'react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useUsuarioDetalle } from '../hooks/useUsuarioDetalle';
import { useDarBajaUsuario, useReactivarUsuario } from '../hooks/useUsuarioBaja';
import { toast, toastError } from '@/lib/toast';

interface Props {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function UsuarioDetailDrawer({ userId, open, onClose }: Props) {
  const { data: user, isLoading } = useUsuarioDetalle(userId);
  const darBaja = useDarBajaUsuario();
  const reactivar = useReactivarUsuario();
  const [showBajaConfirm, setShowBajaConfirm] = useState(false);

  const enBaja = user?.deleted_at != null;

  const handleBaja = ({ motivo }: { motivo?: string }) => {
    if (!user) return;
    darBaja.mutate(
      { id: user.id, motivo },
      {
        onSuccess: (data) => {
          toast.success(`Usuario dado de baja. ${data.ofertas_pausadas} oferta(s) pausada(s).`);
          setShowBajaConfirm(false);
          onClose();
        },
        onError: (err) => toastError(err, 'Error al dar baja.'),
      },
    );
  };

  const handleReactivar = () => {
    if (!user) return;
    reactivar.mutate(user.id, {
      onSuccess: (data) => {
        toast.success(`Usuario reactivado. ${data.ofertas_reactivadas} oferta(s) restaurada(s).`);
        onClose();
      },
      onError: (err) => toastError(err, 'Error al reactivar.'),
    });
  };

  const footer = !isLoading && user && (
    <div className="flex justify-end gap-2">
      {enBaja ? (
        <Button onClick={handleReactivar} disabled={reactivar.isPending}>
          {reactivar.isPending ? 'Reactivando...' : 'Reactivar cuenta'}
        </Button>
      ) : (
        <Button variant="danger" onClick={() => setShowBajaConfirm(true)}>
          Dar baja
        </Button>
      )}
    </div>
  );

  return (
    <>
      <DetailDrawer open={open} onClose={onClose} title="Detalle de usuario" footer={footer ?? undefined}>
        {isLoading || !user ? (
          <p className="text-sm text-text-3">Cargando...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-text-1">{user.nombre}</h3>
                <p className="text-sm text-text-3">{user.email}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge variant={enBaja ? 'error' : user.estado_cuenta === 'suspendida' ? 'warning' : 'success'}>
                    {enBaja ? 'Baja' : user.estado_cuenta}
                  </Badge>
                  <Badge variant={user.estado_verificacion === 'verificado' ? 'success' : 'neutral'}>
                    {user.estado_verificacion}
                  </Badge>
                </div>
              </div>
            </div>

            {enBaja && user.baja && (
              <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-sm">
                <p className="font-medium text-error">Usuario dado de baja</p>
                <p className="mt-1 text-text-2">Fecha: {new Date(user.baja.fecha).toLocaleString('es-MX')}</p>
                {user.baja.motivo && <p className="mt-0.5 text-text-2">Motivo: {user.baja.motivo}</p>}
                {user.baja.dado_baja_por && (
                  <p className="mt-0.5 text-text-2">Por: {user.baja.dado_baja_por.nombre}</p>
                )}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-text-3">Zona</dt>
                <dd className="text-text-1">{user.zona ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-3">Teléfono</dt>
                <dd className="text-text-1">{user.telefono ?? '—'}</dd>
              </div>
            </dl>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-text-1">Resumen</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Ofertas activas</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.ofertas_activas}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Vinculaciones completadas</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.vinculaciones_completadas}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Reseñas recibidas</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.resenas_recibidas}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <p className="text-text-3">Ofertas pausadas por baja</p>
                  <p className="text-base font-semibold text-text-1">{user.counts.ofertas_pausadas_por_admin}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {user && (
        <ConfirmDialog
          open={showBajaConfirm}
          title="Dar baja a usuario"
          message={`Esto dará de baja a ${user.nombre} y pausará ${user.counts.ofertas_activas} oferta(s) activa(s).`}
          motivoLabel="Motivo (opcional)"
          cascadeCheckLabel={user.counts.ofertas_activas > 0 ? `Confirmo que pausará ${user.counts.ofertas_activas} oferta(s).` : undefined}
          confirmLabel="Dar baja"
          loading={darBaja.isPending}
          onConfirm={handleBaja}
          onCancel={() => setShowBajaConfirm(false)}
        />
      )}
    </>
  );
}
