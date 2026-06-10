import { useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Paginacion from '@/features/ofertas/components/Paginacion';
import { useAdminUsuarios, useCambiarEstadoUsuario } from './hooks/useAdminUsuarios';
import { toast, toastError } from '@/lib/toast';
import { useUrlFilters } from '@/lib/urlFilters';
import type { AdminUsuario, EstadoVerificacion, EstadoCuenta } from '@/lib/types';

const verificacionBadge: Record<EstadoVerificacion, 'success' | 'warning' | 'error' | 'neutral'> = {
  verificado: 'success',
  pendiente: 'warning',
  rechazado: 'error',
  no_verificado: 'neutral',
};

const cuentaBadge: Record<EstadoCuenta, 'success' | 'error' | 'neutral'> = {
  activa: 'success',
  suspendida: 'error',
  baja: 'neutral',
};

export default function AdminUsuariosPage() {
  const { searchParams, setFilter, setPage } = useUrlFilters();
  const estadoVerificacion = searchParams.get('verificacion');
  const estadoCuenta = searchParams.get('cuenta');
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') || '1');

  const filtros = useMemo(
    () => ({ estado_verificacion: estadoVerificacion, estado_cuenta: estadoCuenta, q: q || null, page, per_page: 20 }),
    [estadoVerificacion, estadoCuenta, q, page],
  );

  const { data, isLoading } = useAdminUsuarios(filtros);
  const cambiarEstado = useCambiarEstadoUsuario();

  const usuarios = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 20 };

  const handleCambiarEstado = (id: number, nuevoEstado: string, label: string) => {
    if (!window.confirm(`¿Seguro que deseas ${label} a este usuario?`)) return;
    cambiarEstado.mutate(
      { id, estado_cuenta: nuevoEstado },
      {
        onSuccess: () => {
          if (nuevoEstado === 'suspendida') toast.warning('Usuario suspendido');
          else if (nuevoEstado === 'activa') toast.success('Usuario reactivado');
        },
        onError: (err) => toastError(err, 'Error al cambiar el estado del usuario.'),
      },
    );
  };

  const columns: Column<AdminUsuario>[] = [
    { key: 'id', header: 'ID', hideOnMobile: true, render: (u) => <span className="text-text-3">{u.id}</span> },
    { key: 'nombre', header: 'Nombre', render: (u) => <span className="font-medium text-text-1">{u.nombre}</span> },
    { key: 'email', header: 'Email', render: (u) => <span className="max-w-[200px] truncate text-text-2">{u.email}</span> },
    {
      key: 'verificacion', header: 'Verificacion', mobileLabel: 'Verif.',
      render: (u) => <Badge variant={verificacionBadge[u.estado_verificacion] ?? 'neutral'}>{u.estado_verificacion}</Badge>,
    },
    {
      key: 'cuenta', header: 'Cuenta',
      render: (u) => <Badge variant={cuentaBadge[u.estado_cuenta] ?? 'neutral'}>{u.estado_cuenta}</Badge>,
    },
    {
      key: 'acciones', header: 'Acciones',
      render: (u) => (
        <div className="flex gap-2">
          {u.estado_cuenta === 'activa' && (
            <Button variant="danger" onClick={() => handleCambiarEstado(u.id, 'suspendida', 'suspender')} disabled={cambiarEstado.isPending}>
              Suspender
            </Button>
          )}
          {u.estado_cuenta === 'suspendida' && (
            <Button variant="primary" onClick={() => handleCambiarEstado(u.id, 'activa', 'reactivar')} disabled={cambiarEstado.isPending}>
              Reactivar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Gestion de usuarios</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Verificacion</label>
          <select
            value={estadoVerificacion ?? ''}
            onChange={(e) => setFilter('verificacion', e.target.value || null)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="verificado">Verificado</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazado">Rechazado</option>
            <option value="no_verificado">No verificado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Cuenta</label>
          <select
            value={estadoCuenta ?? ''}
            onChange={(e) => setFilter('cuenta', e.target.value || null)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="activa">Activa</option>
            <option value="suspendida">Suspendida</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div className="w-48">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setFilter('q', e.target.value || null)} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={usuarios}
        isLoading={isLoading}
        skeletonRows={6}
        emptyTitle="No hay usuarios"
        emptySubtitle="No se encontraron usuarios con los filtros seleccionados."
        rowKey={(u) => u.id}
      />

      {!isLoading && usuarios.length > 0 && (
        <div className="mt-4">
          <Paginacion page={meta.page} total={meta.total} perPage={meta.per_page} onChange={setPage} />
        </div>
      )}
    </>
  );
}
