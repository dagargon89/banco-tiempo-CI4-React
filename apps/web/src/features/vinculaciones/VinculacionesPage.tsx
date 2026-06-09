import { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { VinculacionCardSkeleton } from '@/components/ui/Skeleton';
import VinculacionCard from './components/VinculacionCard';
import { useListarVinculaciones } from './hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import Paginacion from '@/features/ofertas/components/Paginacion';

type TabKey = 'todas' | 'solicitada' | 'aceptada' | 'historial';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'solicitada', label: 'Pendientes' },
  { key: 'aceptada', label: 'Activas' },
  { key: 'historial', label: 'Historial' },
];

function estadoFromTab(tab: TabKey): string | null {
  if (tab === 'todas') return null;
  if (tab === 'historial') return 'completada,rechazada,cancelada';
  return tab;
}

export default function VinculacionesPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TabKey>('todas');
  const [page, setPage] = useState(1);

  const filtros = useMemo(() => ({
    estado: estadoFromTab(tab),
    page,
    per_page: 12,
  }), [tab, page]);

  const { data, isLoading } = useListarVinculaciones(filtros);

  const vinculaciones = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, per_page: 12 };

  const handleTabChange = (key: TabKey) => {
    setTab(key);
    setPage(1);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <ArrowLeftRight className="h-6 w-6 text-accent" />
        <h1 className="font-display text-xl font-bold text-text-1">Vinculaciones</h1>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-surface-2 p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-surface text-text-1 shadow-sm'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VinculacionCardSkeleton key={i} />
          ))}
        </div>
      ) : vinculaciones.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No hay vinculaciones"
            subtitle="Explora ofertas y marca interes para comenzar."
          />
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-text-3">{meta.total} resultados</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vinculaciones.map((vinc) => (
              <VinculacionCard key={vinc.id} vinculacion={vinc} userId={user!.id} />
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
