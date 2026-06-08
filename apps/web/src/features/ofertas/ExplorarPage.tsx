import { useState, useMemo } from 'react';
import FiltrosBar from './components/FiltrosBar';
import OfertaCardComponent from './components/OfertaCardComponent';
import Paginacion from './components/Paginacion';
import EmptyState from '@/components/ui/EmptyState';
import { useExplorarOfertas } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';

export default function ExplorarPage() {
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [zona, setZona] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data: categorias } = useCategorias();

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

  const handleFiltroChange = (f: { categoriaId?: number | null; modalidad?: string | null; zona?: string; q?: string }) => {
    if (f.categoriaId !== undefined) setCategoriaId(f.categoriaId);
    if (f.modalidad !== undefined) setModalidad(f.modalidad);
    if (f.zona !== undefined) setZona(f.zona);
    if (f.q !== undefined) setQ(f.q);
    setPage(1);
  };

  return (
    <>
      <FiltrosBar
        categoriaId={categoriaId}
        modalidad={modalidad}
        zona={zona}
        q={q}
        onChange={handleFiltroChange}
      />

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
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
          <p className="mt-4 text-sm text-text-3">{meta.total} resultados</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ofertas.map((oferta) => (
              <OfertaCardComponent key={oferta.id} oferta={oferta} categorias={categorias} />
            ))}
          </div>

          <div className="mt-6">
            <Paginacion
              page={meta.page}
              total={meta.total}
              perPage={meta.per_page}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </>
  );
}
