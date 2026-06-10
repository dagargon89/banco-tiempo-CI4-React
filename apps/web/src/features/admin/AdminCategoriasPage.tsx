import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useCrearCategoria } from './hooks/useAdminCategorias';
import { toast, toastError } from '@/lib/toast';

export default function AdminCategoriasPage() {
  const [nombre, setNombre] = useState('');

  const { data: categorias, isLoading } = useCategorias();
  const crearCategoria = useCrearCategoria();

  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    crearCategoria.mutate(nombre.trim(), {
      onSuccess: () => {
        toast.success('Categoría creada');
        setNombre('');
      },
      onError: (err) => toastError(err, 'Error al crear categoría.'),
    });
  };

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Categorias</h1>

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
      </section>

      {/* Lista de categorías */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-1">Categorias existentes</h2>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
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
    </>
  );
}
