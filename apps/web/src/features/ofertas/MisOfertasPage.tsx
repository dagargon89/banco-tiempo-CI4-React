import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useMisOfertas, useCambiarEstadoOferta } from './hooks/useOfertas';

export default function MisOfertasPage() {
  const { data: ofertas, isLoading } = useMisOfertas();
  const cambiarEstado = useCambiarEstadoOferta();

  const handleEstado = (id: number, estado: string) => {
    if (estado === 'eliminada' && !confirm('Esta accion no se puede deshacer. Continuar?')) return;
    cambiarEstado.mutate({ id, estado });
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      activa: 'success', pausada: 'warning', borrador: 'neutral', eliminada: 'error',
    };
    return map[estado] ?? 'neutral';
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-text-1">Mis ofertas</h1>
          <Link to="/ofertas/nueva">
            <Button>+ Nueva oferta</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : !ofertas || ofertas.length === 0 ? (
          <EmptyState
            title="No tienes ofertas aun"
            subtitle="Publica tu primera oferta para empezar a intercambiar tiempo."
          />
        ) : (
          <div className="space-y-3">
            {ofertas.map((oferta) => (
              <div
                key={oferta.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <Link to={`/ofertas/${oferta.id}`} className="text-sm font-semibold text-text-1 hover:text-accent">
                    {oferta.titulo}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={estadoBadge(oferta.estado)}>{oferta.estado}</Badge>
                    <span className="text-xs text-text-3">{oferta.modalidad}</span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link to={`/ofertas/${oferta.id}/editar`}>
                    <Button variant="secondary">Editar</Button>
                  </Link>
                  {oferta.estado === 'activa' && (
                    <Button variant="secondary" onClick={() => handleEstado(oferta.id, 'pausada')} disabled={cambiarEstado.isPending}>
                      Pausar
                    </Button>
                  )}
                  {oferta.estado === 'pausada' && (
                    <Button variant="secondary" onClick={() => handleEstado(oferta.id, 'activa')} disabled={cambiarEstado.isPending}>
                      Reanudar
                    </Button>
                  )}
                  {oferta.estado !== 'eliminada' && (
                    <Button variant="danger" onClick={() => handleEstado(oferta.id, 'eliminada')} disabled={cambiarEstado.isPending}>
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
