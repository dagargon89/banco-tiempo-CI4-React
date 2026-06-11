import { useState } from 'react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useUsuarioDetalle } from '../hooks/useUsuarioDetalle';
import { useDarBajaUsuario, useReactivarUsuario } from '../hooks/useUsuarioBaja';
import { useAsignarRol, useRevocarRol, type Rol } from '../hooks/useRoles';
import { useAuthStore } from '@/stores/authStore';
import { toast, toastError } from '@/lib/toast';

const ROLES_DISPONIBLES: { value: Rol; label: string; descripcion: string }[] = [
  {
    value: 'super_admin',
    label: 'Super admin',
    descripcion: 'Control total. Gestiona usuarios, roles, categorías y configuración del sistema. Solo para personas de máxima confianza.',
  },
  {
    value: 'moderador',
    label: 'Moderador',
    descripcion: 'Acceso operativo amplio: modera ofertas, verifica identidades y atiende tickets. No toca configuración del sistema.',
  },
  {
    value: 'soporte',
    label: 'Soporte',
    descripcion: 'Atención a usuarios vía tickets (lee, responde, escala). No verifica identidades ni modera ofertas.',
  },
  {
    value: 'verificador',
    label: 'Verificador',
    descripcion: 'Aprueba o rechaza documentos de identidad. No interviene en tickets ni en moderación de ofertas.',
  },
  {
    value: 'analista',
    label: 'Analista',
    descripcion: 'Acceso solo lectura: métricas, reportes y listados. No realiza acciones de moderación.',
  },
  {
    value: 'editor_categorias',
    label: 'Editor de categorías',
    descripcion: 'Gestiona el catálogo de categorías (crear, editar, activar/desactivar). No administra usuarios ni contenido.',
  },
];

const ROL_BADGE_VARIANT: Record<Rol, 'warning' | 'info' | 'success' | 'neutral'> = {
  super_admin: 'warning',
  moderador: 'info',
  soporte: 'success',
  verificador: 'success',
  analista: 'neutral',
  editor_categorias: 'neutral',
};

function rolLabel(r: Rol): string {
  return ROLES_DISPONIBLES.find((x) => x.value === r)?.label ?? r;
}

interface Props {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function UsuarioDetailDrawer({ userId, open, onClose }: Props) {
  const { data: user, isLoading } = useUsuarioDetalle(userId);
  const darBaja = useDarBajaUsuario();
  const reactivar = useReactivarUsuario();
  const asignarRol = useAsignarRol();
  const revocarRol = useRevocarRol();
  const currentUser = useAuthStore((s) => s.user);
  const [showBajaConfirm, setShowBajaConfirm] = useState(false);

  const enBaja = user?.deleted_at != null;
  const esSuperAdmin = currentUser?.roles.includes('super_admin') ?? false;
  const userRoles = (user?.roles ?? []) as Rol[];

  const handleAsignarRol = (rol: Rol) => {
    if (!user) return;
    asignarRol.mutate(
      { id: user.id, rol },
      {
        onSuccess: () => toast.success(`Rol "${rol}" asignado.`),
        onError: (err) => toastError(err, 'Error al asignar rol.'),
      },
    );
  };

  const handleRevocarRol = (rol: Rol) => {
    if (!user) return;
    if (!window.confirm(`¿Revocar el rol "${rol}" a ${user.nombre}?`)) return;
    revocarRol.mutate(
      { id: user.id, rol },
      {
        onSuccess: () => toast.success(`Rol "${rol}" revocado.`),
        onError: (err) => toastError(err, 'Error al revocar rol.'),
      },
    );
  };

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

            {/* Roles administrativos */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-text-1">Roles administrativos</h4>
              {userRoles.length === 0 ? (
                <p className="mb-3 text-xs italic text-text-3">Sin roles administrativos.</p>
              ) : (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {userRoles.map((r) => (
                    <Badge key={r} variant={ROL_BADGE_VARIANT[r] ?? 'neutral'}>
                      {rolLabel(r)}
                    </Badge>
                  ))}
                </div>
              )}

              {esSuperAdmin && !enBaja && user.estado_cuenta === 'activa' && (
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-3">Gestionar roles</p>
                  <ul className="divide-y divide-border">
                    {ROLES_DISPONIBLES.map(({ value, label, descripcion }) => {
                      const tiene = userRoles.includes(value);
                      const esYoMismoSuper = value === 'super_admin' && currentUser?.id === user.id;
                      const busy = asignarRol.isPending || revocarRol.isPending;
                      return (
                        <li key={value} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-sm font-medium text-text-1">
                              {label}
                              {tiene && <Badge variant={ROL_BADGE_VARIANT[value] ?? 'neutral'}>Asignado</Badge>}
                            </p>
                            <p className="mt-0.5 text-xs leading-snug text-text-3">{descripcion}</p>
                          </div>
                          {tiene ? (
                            <Button
                              variant="danger"
                              disabled={busy || esYoMismoSuper}
                              onClick={() => handleRevocarRol(value)}
                            >
                              Quitar
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() => handleAsignarRol(value)}
                            >
                              Asignar
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {currentUser?.id === user.id && userRoles.includes('super_admin') && (
                    <p className="mt-2 text-[11px] italic text-text-3">No puedes revocar tu propio rol super_admin.</p>
                  )}
                </div>
              )}
              {!esSuperAdmin && (
                <p className="text-xs italic text-text-3">Solo super_admin puede modificar roles.</p>
              )}
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
