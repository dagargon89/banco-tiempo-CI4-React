import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Paginacion from '@/features/ofertas/components/Paginacion';
import { useAdminOfertas, useDespublicarOferta } from './hooks/useAdminOfertas';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';

export default function AdminOfertasPage() {
  const [estado, setEstado] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtros = useMemo(
    () => ({ estado, categoria_id: categoriaId, q: q || null, page, per_page: 20 }),
    [estado, categoriaId, q, page],
  );

  const { data, isLoading } = useAdminOfertas(filtros);
  const { data: categorias } = useCategorias();
  const despublicar = useDespublicarOferta();

  const ofertas = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 20 };

  const estadoBadge = (e: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      activa: 'success', pausada: 'warning', borrador: 'neutral', eliminada: 'error',
    };
    return map[e] ?? 'neutral';
  };

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Moderacion de ofertas</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Estado</label>
          <select
            value={estado ?? ''}
            onChange={(e) => { setEstado(e.target.value || null); setPage(1); }}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todos</option>
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
            <option value="borrador">Borrador</option>
            <option value="eliminada">Eliminada</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-2">Categoria</label>
          <select
            value={categoriaId ?? ''}
            onChange={(e) => { setCategoriaId(e.target.value ? Number(e.target.value) : null); setPage(1); }}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1"
          >
            <option value="">Todas</option>
            {categorias?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
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
      ) : ofertas.length === 0 ? (
        <EmptyState title="No hay ofertas" subtitle="No se encontraron ofertas con los filtros seleccionados." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs text-text-2">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Titulo</th>
                  <th className="px-4 py-3">Oferente</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {ofertas.map((o: any) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 text-text-3">{o.id}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-text-1">{o.titulo}</td>
                    <td className="px-4 py-3 text-text-2">{o.oferente_nombre}</td>
                    <td className="px-4 py-3"><Badge variant={estadoBadge(o.estado)}>{o.estado}</Badge></td>
                    <td className="px-4 py-3">
                      {o.estado === 'activa' && (
                        <Button variant="danger" onClick={() => despublicar.mutate(o.id)} disabled={despublicar.isPending}>
                          Despublicar
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
