import { useState } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useCrearCategoria, useUpdateCategoria, useToggleCategoria } from './hooks/useAdminCategorias';
import { toast, toastError } from '@/lib/toast';
import type { Categoria } from '@/lib/types';

export default function AdminCategoriasPage() {
  const { data: categorias, isLoading } = useCategorias();
  const crearCategoria = useCrearCategoria();
  const updateCategoria = useUpdateCategoria();
  const toggleCategoria = useToggleCategoria();

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    crearCategoria.mutate(nuevoNombre.trim(), {
      onSuccess: () => {
        toast.success('Categoría creada');
        setNuevoNombre('');
      },
      onError: (err) => toastError(err, 'Error al crear categoría.'),
    });
  };

  const startEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setEditValue(cat.nombre);
  };

  const saveEdit = () => {
    if (editingId == null || !editValue.trim()) return;
    updateCategoria.mutate(
      { id: editingId, nombre: editValue.trim() },
      {
        onSuccess: () => {
          toast.success('Categoría actualizada');
          setEditingId(null);
        },
        onError: (err) => toastError(err, 'Error al actualizar.'),
      },
    );
  };

  const handleToggle = (cat: Categoria) => {
    const nuevaActiva = !cat.activa;
    toggleCategoria.mutate(
      { id: cat.id, activa: nuevaActiva },
      {
        onSuccess: () => toast.success(nuevaActiva ? 'Categoría activada' : 'Categoría desactivada'),
        onError: (err) => toastError(err, 'Error al cambiar estado.'),
      },
    );
  };

  const columns: Column<Categoria>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (c) =>
        editingId === c.id ? (
          <div className="flex gap-1">
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} />
            <button
              onClick={saveEdit}
              aria-label="Guardar"
              className="rounded p-1.5 text-success hover:bg-surface-2"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              aria-label="Cancelar"
              className="rounded p-1.5 text-text-3 hover:bg-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="font-medium text-text-1">{c.nombre}</span>
        ),
    },
    {
      key: 'slug',
      header: 'Slug',
      mobileLabel: 'Slug',
      render: (c) => <code className="text-xs text-text-3">{c.slug}</code>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <Badge variant={c.activa ? 'success' : 'neutral'}>
          {c.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (c) => (
        <div className="flex gap-1">
          {editingId !== c.id && (
            <button
              onClick={() => startEdit(c)}
              aria-label="Editar"
              className="rounded p-1.5 text-text-3 hover:bg-surface-2 hover:text-accent"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <Button
            variant="secondary"
            onClick={() => handleToggle(c)}
            disabled={toggleCategoria.isPending}
          >
            {c.activa ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Categorias</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-text-1">Crear categoria</h2>
        <form onSubmit={handleCrear} className="flex items-end gap-3">
          <div className="w-64">
            <Input
              placeholder="Nombre de la categoria"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              maxLength={80}
            />
          </div>
          <Button type="submit" disabled={crearCategoria.isPending || !nuevoNombre.trim()}>
            Crear
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-1">Categorias existentes</h2>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <DataTable
            columns={columns}
            data={categorias ?? []}
            rowKey={(c) => c.id}
            emptyTitle="Sin categorías"
          />
        )}
      </section>
    </>
  );
}
