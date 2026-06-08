import { Link } from 'react-router-dom';
import { LayoutGrid, Bell, Link2, CheckCircle, Pencil, Pause, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { useMisOfertas, useCambiarEstadoOferta } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';
import { useAuthStore } from '@/stores/authStore';
import { getCategoryConfigById } from '@/lib/categoryConfig';

export default function MisOfertasPage() {
  const user = useAuthStore((s) => s.user);
  const { data: ofertas, isLoading } = useMisOfertas();
  const { data: categorias } = useCategorias();
  const cambiarEstado = useCambiarEstadoOferta();

  const handleEstado = (id: number, estado: string) => {
    if (estado === 'eliminada' && !confirm('Esta accion no se puede deshacer. Continuar?')) return;
    cambiarEstado.mutate({ id, estado });
  };

  const activas = ofertas?.filter((o) => o.estado === 'activa') ?? [];

  const stats = [
    { icon: LayoutGrid, label: 'Ofertas publicadas', value: activas.length, color: 'bg-accent/10 text-accent' },
    { icon: Bell, label: 'Solicitudes nuevas', value: 0, color: 'bg-amber-50 text-amber-500' },
    { icon: Link2, label: 'Vinculaciones activas', value: 0, color: 'bg-blue-50 text-blue-500' },
    { icon: CheckCircle, label: 'Actividades completadas', value: 0, color: 'bg-emerald-50 text-emerald-500' },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-1">Panel del oferente</h1>
          <p className="mt-1 text-sm text-text-2">
            Hola {user?.nombre?.split(' ')[0]}, administra tus habilidades y solicitudes.
          </p>
        </div>
        <Link to="/ofertas/nueva">
          <Button>+ Publicar habilidad</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-1">{s.value}</p>
              <p className="text-xs text-text-3">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Personas interesadas (placeholder - Sprint 4) */}
      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text-1">
          Personas interesadas
          <Badge variant="neutral">0</Badge>
        </h2>
        <div className="mt-3">
          <EmptyState
            title="Sin solicitudes pendientes"
            subtitle="Cuando alguien muestre interes en tus ofertas, aparecera aqui."
          />
        </div>
      </div>

      {/* Mis habilidades */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-1">Mis habilidades</h2>

        {isLoading ? (
          <div className="mt-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : !ofertas || ofertas.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No tienes habilidades publicadas"
              subtitle="Publica tu primera oferta para empezar a intercambiar tiempo."
            />
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ofertas.map((oferta) => {
              const catConfig = getCategoryConfigById(oferta.categoria_id, categorias);
              const Icon = catConfig.icon;

              return (
                <div key={oferta.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${catConfig.accent}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/ofertas/${oferta.id}`} className="text-sm font-semibold text-text-1 hover:text-accent">
                        {oferta.titulo}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={oferta.estado === 'activa' ? 'success' : oferta.estado === 'pausada' ? 'warning' : 'neutral'}>
                          {oferta.estado === 'activa' ? 'Activa' : oferta.estado === 'pausada' ? 'Pausada' : oferta.estado}
                        </Badge>
                        <span className="text-xs text-text-3">0 interesados</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                    <Link to={`/ofertas/${oferta.id}/editar`} className="flex items-center gap-1 text-xs text-text-2 hover:text-accent">
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Link>
                    {oferta.estado === 'activa' && (
                      <button
                        onClick={() => handleEstado(oferta.id, 'pausada')}
                        disabled={cambiarEstado.isPending}
                        className="flex items-center gap-1 text-xs text-text-2 hover:text-amber-500"
                      >
                        <Pause className="h-3.5 w-3.5" /> Pausar
                      </button>
                    )}
                    {oferta.estado === 'pausada' && (
                      <button
                        onClick={() => handleEstado(oferta.id, 'activa')}
                        disabled={cambiarEstado.isPending}
                        className="flex items-center gap-1 text-xs text-text-2 hover:text-accent"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Reanudar
                      </button>
                    )}
                    <button
                      onClick={() => handleEstado(oferta.id, 'eliminada')}
                      disabled={cambiarEstado.isPending}
                      className="ml-auto flex items-center gap-1 text-xs text-error hover:text-error/80"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de vinculaciones (placeholder - Sprint 4) */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-1">Historial de vinculaciones</h2>
        <div className="mt-3">
          <EmptyState
            title="Sin vinculaciones"
            subtitle="Tu historial de intercambios aparecera aqui."
          />
        </div>
      </div>
    </>
  );
}
