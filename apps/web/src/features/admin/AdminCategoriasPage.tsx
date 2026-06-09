import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useCrearCategoria } from './hooks/useAdminCategorias';
import { useCrearModerador, useEliminarModerador } from './hooks/useAdminModeradores';

export default function AdminCategoriasPage() {
  const [nombre, setNombre] = useState('');
  const [modUserId, setModUserId] = useState('');

  const { data: categorias, isLoading } = useCategorias();
  const crearCategoria = useCrearCategoria();
  const crearModerador = useCrearModerador();
  const eliminarModerador = useEliminarModerador();

  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    crearCategoria.mutate(nombre.trim(), { onSuccess: () => setNombre('') });
  };

  const handleCrearModerador = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number(modUserId);
    if (!id) return;
    crearModerador.mutate(id, { onSuccess: () => setModUserId('') });
  };

  const handleRevocarModerador = (userId: number) => {
    if (!window.confirm('¿Seguro que deseas revocar el rol de moderador?')) return;
    eliminarModerador.mutate(userId);
  };

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Categorias y moderadores</h1>

      {/* Crear categoría */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-1">Crear categoria</h2>
        <form onSubmit={handleCrearCategoria} className="flex items-end gap-3">
          <div className="w-64">
            <Input
              placeholder="Nombre de la categoria"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={80}
            />
          </div>
          <Button type="submit" disabled={crearCategoria.isPending || !nombre.trim()}>
            Crear
          </Button>
        </form>
        {crearCategoria.isError && (
          <p className="mt-2 text-sm text-error">
            {(crearCategoria.error as any)?.response?.data?.message ?? 'Error al crear categoría'}
          </p>
        )}
      </section>

      {/* Lista de categorías */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-1">Categorias existentes</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : !categorias || categorias.length === 0 ? (
          <p className="text-sm text-text-3">No hay categorías.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <Badge key={cat.id} variant={cat.activa ? 'success' : 'neutral'}>
                {cat.nombre}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Moderadores */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-1">Gestionar moderadores</h2>
        <form onSubmit={handleCrearModerador} className="mb-4 flex items-end gap-3">
          <div className="w-48">
            <Input
              placeholder="User ID"
              type="number"
              value={modUserId}
              onChange={(e) => setModUserId(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={crearModerador.isPending || !modUserId}>
            Promover a moderador
          </Button>
        </form>
        {crearModerador.isError && (
          <p className="mt-2 text-sm text-error">
            {(crearModerador.error as any)?.response?.data?.message ?? 'Error al crear moderador'}
          </p>
        )}

        <div className="mt-4">
          <p className="text-xs text-text-3">
            Para revocar un moderador, ingresa el user_id:
          </p>
          <div className="mt-2 flex items-end gap-3">
            <div className="w-48">
              <Input
                placeholder="User ID a revocar"
                type="number"
                id="revocar-mod-id"
              />
            </div>
            <Button
              variant="danger"
              disabled={eliminarModerador.isPending}
              onClick={() => {
                const input = document.getElementById('revocar-mod-id') as HTMLInputElement;
                const id = Number(input?.value);
                if (id) handleRevocarModerador(id);
              }}
            >
              Revocar
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
