import { useState, useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Paginacion from '@/features/ofertas/components/Paginacion';
import { useAdminUsuarios, useCambiarEstadoUsuario } from './hooks/useAdminUsuarios';
import type { EstadoVerificacion, EstadoCuenta } from '@/lib/types';

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
  const [estadoVerificacion, setEstadoVerificacion] = useState<string | null>(null);
  const [estadoCuenta, setEstadoCuenta] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

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
    cambiarEstado.mutate({ id, estado_cuenta: nuevoEstado });
  };

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Gestion de usuarios</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Verificacion</label>
          <select
            value={estadoVerificacion ?? ''}
            onChange={(e) => { setEstadoVerificacion(e.target.value || null); setPage(1); }}
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
            onChange={(e) => { setEstadoCuenta(e.target.value || null); setPage(1); }}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="activa">Activa</option>
            <option value="suspendida">Suspendida</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div className="w-48">
          <Input placeholder="Buscar..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : usuarios.length === 0 ? (
        <EmptyState title="No hay usuarios" subtitle="No se encontraron usuarios con los filtros seleccionados." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-text-2">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Verificacion</th>
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-text-3">{u.id}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-text-1">{u.nombre}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-text-2">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={verificacionBadge[u.estado_verificacion] ?? 'neutral'}>
                        {u.estado_verificacion}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cuentaBadge[u.estado_cuenta] ?? 'neutral'}>
                        {u.estado_cuenta}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.estado_cuenta === 'activa' && (
                        <Button
                          variant="danger"
                          onClick={() => handleCambiarEstado(u.id, 'suspendida', 'suspender')}
                          disabled={cambiarEstado.isPending}
                        >
                          Suspender
                        </Button>
                      )}
                      {u.estado_cuenta === 'suspendida' && (
                        <Button
                          variant="primary"
                          onClick={() => handleCambiarEstado(u.id, 'activa', 'reactivar')}
                          disabled={cambiarEstado.isPending}
                        >
                          Reactivar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Paginacion page={meta.page} total={meta.total} perPage={meta.per_page} onChange={setPage} />
          </div>
        </>
      )}
    </>
  );
}
