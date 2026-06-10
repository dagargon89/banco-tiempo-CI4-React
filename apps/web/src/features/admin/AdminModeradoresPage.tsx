import { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton, { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useAdminUsuarios } from './hooks/useAdminUsuarios';
import { useModeradores, useCrearModerador, useEliminarModerador } from './hooks/useAdminModeradores';
import { toast, toastError } from '@/lib/toast';

export default function AdminModeradoresPage() {
  const [busqueda, setBusqueda] = useState('');

  const { data: moderadores, isLoading: loadingMods } = useModeradores();
  const crearModerador = useCrearModerador();
  const eliminarModerador = useEliminarModerador();

  // Lista de usuarios activos, filtrada por búsqueda si hay texto
  const { data: usuariosData, isLoading: loadingUsuarios } = useAdminUsuarios({
    q: busqueda.trim() || null,
    estado_cuenta: 'activa',
    per_page: 20,
  });

  const usuarios = usuariosData?.data ?? [];
  const modsIds = new Set((moderadores ?? []).map((m) => m.id));

  // Filtrar usuarios que ya son moderadores
  const candidatos = usuarios.filter((u) => !modsIds.has(u.id));

  const handlePromover = (userId: number, nombre: string) => {
    crearModerador.mutate(userId, {
      onSuccess: () => toast.success(`${nombre} ahora es moderador`),
      onError: (err) => toastError(err, 'Error al promover a moderador.'),
    });
  };

  const handleRevocar = (userId: number, nombre: string) => {
    if (!window.confirm(`¿Revocar rol de moderador a ${nombre}?`)) return;
    eliminarModerador.mutate(userId, {
      onSuccess: () => toast.info(`Se revocó el rol de moderador a ${nombre}`),
      onError: (err) => toastError(err, 'Error al revocar moderador.'),
    });
  };

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Gestionar moderadores</h1>

      {/* Promover moderador */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-1">Promover usuario a moderador</h2>
        <div className="mb-3 w-72">
          <Input
            placeholder="Buscar usuario por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="max-h-80 overflow-y-auto rounded-xl border border-border bg-surface">
          {loadingUsuarios ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circle" className="h-8 w-8" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </li>
              ))}
            </ul>
          ) : candidatos.length === 0 ? (
            <p className="px-4 py-4 text-sm text-text-3">
              {usuarios.length > 0 ? 'Todos los usuarios ya son moderadores.' : 'No se encontraron usuarios.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidatos.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar nombre={u.nombre} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-text-1">{u.nombre}</p>
                      <p className="text-xs text-text-3">{u.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handlePromover(u.id, u.nombre)}
                    disabled={crearModerador.isPending}
                  >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Promover
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Lista de moderadores actuales */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-1">Moderadores actuales</h2>

        {loadingMods ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-text-2">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : !moderadores || moderadores.length === 0 ? (
          <EmptyState title="Sin moderadores" subtitle="No hay moderadores asignados actualmente." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-text-2">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {moderadores.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={m.foto_perfil} nombre={m.nombre} size="sm" />
                        <span className="font-medium text-text-1">{m.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-2">{m.email}</td>
                    <td className="px-4 py-3 text-text-3">
                      {m.asignado_at ? new Date(m.asignado_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        onClick={() => handleRevocar(m.id, m.nombre)}
                        disabled={eliminarModerador.isPending}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Revocar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
