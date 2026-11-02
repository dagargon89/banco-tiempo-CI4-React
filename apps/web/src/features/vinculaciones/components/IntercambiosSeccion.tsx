import { useState } from 'react';
import { SectionTitle } from '@/components/ui/PageHeader';
import { VinculacionCardSkeleton } from '@/components/ui/Skeleton';
import IntercambioCard from './IntercambioCard';
import { useListarVinculaciones } from '../hooks/useVinculaciones';
import type { Papel } from '@/lib/intercambio';

interface Props {
  titulo: string;
  papel: Papel;
  estado: string;
  /** Texto cuando la sección está vacía. Sin él, la sección se oculta vacía. */
  vacio?: string;
  /** Cuántos mostrar antes de "Ver más". */
  limite?: number;
}

/** Una sección de intercambios filtrada por papel y estado. */
export default function IntercambiosSeccion({ titulo, papel, estado, vacio, limite = 6 }: Props) {
  const [verTodos, setVerTodos] = useState(false);
  const { data, isLoading } = useListarVinculaciones({
    estado,
    rol: papel === 'ensenando' ? 'oferente' : 'buscador',
    per_page: 50,
  });
  const items = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  if (!isLoading && items.length === 0 && !vacio) return null;
  const visibles = verTodos ? items : items.slice(0, limite);

  return (
    <section className="mb-12">
      <SectionTitle count={total}>{titulo}</SectionTitle>
      {isLoading ? (
        <div className="space-y-3">
          <VinculacionCardSkeleton />
          <VinculacionCardSkeleton />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong px-5 py-6 text-text-2">{vacio}</p>
      ) : (
        <>
          <div className="space-y-3">
            {visibles.map((v) => (
              <IntercambioCard key={v.id} vinculacion={v} papel={papel} />
            ))}
          </div>
          {items.length > limite && (
            <button
              type="button"
              onClick={() => setVerTodos((x) => !x)}
              className="mt-4 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-1 hover:border-border-strong"
            >
              {verTodos ? 'Ver menos' : `Ver los ${items.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
