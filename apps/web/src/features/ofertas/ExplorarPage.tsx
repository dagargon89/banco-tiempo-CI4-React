import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LayoutGrid } from 'lucide-react';
import OfertaCardComponent from './components/OfertaCardComponent';
import Paginacion from './components/Paginacion';
import EmptyState from '@/components/ui/EmptyState';
import { OfertaCardSkeleton } from '@/components/ui/Skeleton';
import { useExplorarOfertas } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { useAuthStore } from '@/stores/authStore';

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
      per_page: 8,
    }),
    [categoriaId, modalidad, zona, q, page],
  );

  const { data, isLoading } = useExplorarOfertas(filtros);

  const ofertas = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 8 };

  const nombre = useAuthStore((st) => st.user?.nombre?.split(' ')[0]);
  const chip = (activo: boolean) =>
    `flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
      activo ? 'bg-text-1 text-bg' : 'border border-border bg-surface text-text-1 hover:border-border-strong'
    }`;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Encabezado: la misma pregunta y el mismo buscador de la landing */}
      <header className="pb-8 pt-4 sm:pt-8">
        {nombre && <p className="text-text-2">Hola, {nombre}</p>}
        <h1 className="mt-1 font-display text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text-1 sm:text-5xl">
          ¿Qué quieres aprender hoy?
        </h1>
        <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-full border border-border-strong bg-surface p-1.5 pl-5 shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <Search className="h-5 w-5 shrink-0 text-text-3" aria-hidden />
          <label htmlFor="explorar-q" className="sr-only">Buscar ofertas</label>
          <input
            id="explorar-q"
            type="search"
            placeholder="Guitarra, inglés, cocina…"
            value={q}
            onChange={(e) => setFilter('q', e.target.value || null)}
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-text-1 placeholder:text-text-2 focus:outline-none"
          />
        </div>
      </header>

      {/* Categorías */}
      <div className="-mx-4 mb-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Categorías">
        <button onClick={() => setFilter('cat', null)} aria-pressed={!categoriaId} className={chip(!categoriaId)}>
          <LayoutGrid className="h-4 w-4" aria-hidden />
          Todas
        </button>
        {categorias?.map((cat) => {
          const cfg = getCategoryConfig(cat.slug);
          const Icon = cfg.icon;
          const active = categoriaId === Number(cat.id);
          return (
            <button key={cat.id} onClick={() => setFilter('cat', active ? null : String(cat.id))} aria-pressed={active} className={chip(active)}>
              <Icon className={`h-4 w-4 ${active ? '' : cfg.ink}`} aria-hidden />
              {cat.nombre}
            </button>
          );
        })}
      </div>

      {/* Modalidad, zona y conteo */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-surface p-1" role="group" aria-label="Modalidad">
          {modalidades.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter('mod', value || null)}
              aria-pressed={(modalidad ?? '') === value}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                (modalidad ?? '') === value ? 'bg-surface-2 font-medium text-text-1' : 'text-text-2 hover:text-text-1'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label htmlFor="explorar-zona" className="sr-only">Zona</label>
        <input
          id="explorar-zona"
          type="text"
          placeholder="Zona o colonia"
          value={zona}
          onChange={(e) => setFilter('zona', e.target.value || null)}
          className="h-10 w-44 rounded-full border border-border bg-surface px-4 text-sm text-text-1 placeholder:text-text-2 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
        />

        {!isLoading && (
          <span className="ml-auto text-sm text-text-2">{meta.total === 1 ? '1 oferta' : `${meta.total} ofertas`}</span>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <OfertaCardSkeleton key={i} />
          ))}
        </div>
      ) : ofertas.length === 0 ? (
        <EmptyState
          title="No se encontraron ofertas"
          subtitle="Prueba con otra palabra o quita algún filtro. Si tú sabes hacerlo, puedes ofrecerlo."
          action={{ label: 'Ofrecer algo', to: '/ofertas/nueva' }}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
    </div>
  );
}
