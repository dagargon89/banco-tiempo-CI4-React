import { Link } from 'react-router-dom';
import { LayoutGrid, Bell, Link2, CheckCircle, Pencil, Pause, Trash2, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from '@/features/vinculaciones/components/EstadoBadge';
import AccionesVinculacion from '@/features/vinculaciones/components/AccionesVinculacion';
import { useMisOfertas, useCambiarEstadoOferta } from './hooks/useOfertas';
import { useCategorias } from './hooks/useCategorias';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { getCategoryConfigById } from '@/lib/categoryConfig';

export default function MisOfertasPage() {
  const user = useAuthStore((s) => s.user);
  const { data: ofertas, isLoading } = useMisOfertas();
  const { data: categorias } = useCategorias();
  const cambiarEstado = useCambiarEstadoOferta();

  // Solicitudes pendientes (donde soy oferente, estado solicitada)
  const { data: solicitudesData } = useListarVinculaciones({ estado: 'solicitada', rol: 'oferente', per_page: 50 });
  const solicitudes = solicitudesData?.data ?? [];

  // Vinculaciones activas (donde soy oferente, estado aceptada)
  const { data: activasVincData } = useListarVinculaciones({ estado: 'aceptada', rol: 'oferente', per_page: 50 });
  const vinculacionesActivas = activasVincData?.data ?? [];

  const handleEstado = (id: number, estado: string) => {
    if (estado === 'eliminada' && !confirm('Esta accion no se puede deshacer. Continuar?')) return;
    cambiarEstado.mutate({ id, estado });
  };

  const ofertasActivas = ofertas?.filter((o) => o.estado === 'activa') ?? [];

  const stats = [
    { icon: LayoutGrid, label: 'Ofertas publicadas', value: ofertasActivas.length, color: 'bg-accent/10 text-accent' },
    { icon: Bell, label: 'Solicitudes nuevas', value: solicitudes.length, color: 'bg-amber-50 text-amber-500' },
    { icon: Link2, label: 'Vinculaciones activas', value: vinculacionesActivas.length, color: 'bg-blue-50 text-blue-500' },
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

      {/* Acciones pendientes — bloque urgente */}
      {solicitudes.length > 0 && (
        <div className="mt-8 rounded-xl border border-accent/20 bg-accent-soft p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-1">
            <Zap className="h-5 w-5 text-accent" />
            {solicitudes.length} {solicitudes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
          </h2>
          <div className="mt-3 space-y-3">
            {solicitudes.map((vinc) => (
              <div key={vinc.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={vinc.buscador_foto} nombre={vinc.buscador_nombre} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-text-1">{vinc.buscador_nombre}</p>
                      <p className="text-xs text-text-3">
                        Interesado en <Link to={`/ofertas/${vinc.oferta_id}`} className="text-accent hover:underline">{vinc.oferta_titulo}</Link>
                      </p>
                      <p className="mt-0.5 text-xs text-text-3">
                        {new Date(vinc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <EstadoBadge estado={vinc.estado} />
                </div>
                {user && (
                  <div className="mt-3 border-t border-border pt-3">
                    <AccionesVinculacion vinculacion={vinc} userId={user.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {solicitudes.length === 0 && (
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
      )}

      {/* Vinculaciones activas */}
      {vinculacionesActivas.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-1">
            Vinculaciones activas
            <Badge variant="success">{vinculacionesActivas.length}</Badge>
          </h2>
          <div className="mt-3 space-y-3">
            {vinculacionesActivas.map((vinc) => (
              <Link key={vinc.id} to={`/vinculaciones/${vinc.id}`} className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={vinc.buscador_foto} nombre={vinc.buscador_nombre} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-text-1">{vinc.buscador_nombre}</p>
                      <p className="text-xs text-text-3">{vinc.oferta_titulo}</p>
                    </div>
                  </div>
                  <EstadoBadge estado={vinc.estado} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
    </>
  );
}
