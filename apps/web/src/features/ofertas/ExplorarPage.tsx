import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import OfertaCardComponent from './components/OfertaCardComponent';
import Paginacion from './components/Paginacion';
import EmptyState from '@/components/ui/EmptyState';
import { OfertaCardSkeleton } from '@/components/ui/Skeleton';
import { useExplorarOfertas } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';

const modalidades = [
  { value: '', label: 'Todas' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
];

export default function ExplorarPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoriaId = searchParams.get('cat') ? Number(searchParams.get('cat')) : null;
  const modalidad = searchParams.get('mod') || null;
  const zona = searchParams.get('zona') || '';
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || '1');

  const { data: categorias } = useCategorias();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value) next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const filtros = useMemo(
    () => ({
      categoria_id: categoriaId,
      modalidad,
      zona: zona || null,
      q: q || null,
      page,
      per_page: 12,
    }),
    [categoriaId, modalidad, zona, q, page],
  );

  const { data, isLoading } = useExplorarOfertas(filtros);

  const ofertas = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 12 };

  return (
    <>
      {/* Hero search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" />
        <input
          type="text"
          placeholder="Busca habilidades, personas o zonas..."
          value={q}
          onChange={(e) => setFilter('q', e.target.value || null)}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-sm text-text-1 placeholder:text-text-3 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
      </div>

      {/* Category chips */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setFilter('cat', null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !categoriaId ? 'bg-accent text-white' : 'border border-border bg-surface text-text-2 hover:bg-surface-2'
          }`}
        >
          Todas
        </button>
        {categorias?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter('cat', categoriaId === cat.id ? null : String(cat.id))}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              categoriaId === cat.id ? 'bg-accent text-white' : 'border border-border bg-surface text-text-2 hover:bg-surface-2'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Modalidad pills + zona */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
          {modalidades.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('mod', value || null)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                (modalidad ?? '') === value ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Zona"
          value={zona}
          onChange={(e) => setFilter('zona', e.target.value || null)}
          className="h-9 w-36 rounded-lg border border-border bg-surface px-3 text-xs text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />

        {meta.total > 0 && !isLoading && (
          <span className="text-xs text-text-3">{meta.total} resultados</span>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <OfertaCardSkeleton key={i} />
          ))}
        </div>
      ) : ofertas.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No se encontraron ofertas"
            subtitle="Intenta ajustar los filtros o busca algo diferente."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ofertas.map((oferta) => (
              <OfertaCardComponent key={oferta.id} oferta={oferta} categorias={categorias} />
            ))}
          </div>

          <div className="mt-6">
            <Paginacion
              page={meta.page}
              total={meta.total}
              perPage={meta.per_page}
              onChange={(p) => setFilter('page', p > 1 ? String(p) : null)}
            />
          </div>
        </>
      )}
    </>
  );
}
