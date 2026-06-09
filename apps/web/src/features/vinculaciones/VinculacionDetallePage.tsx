import { useParams, Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import EstadoBadge from './components/EstadoBadge';
import AccionesVinculacion from './components/AccionesVinculacion';
import PanelConfirmacion from './components/PanelConfirmacion';
import { useVinculacionDetalle } from './hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';

export default function VinculacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: vinculacion, isLoading } = useVinculacionDetalle(id!);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!vinculacion) {
    return <p className="text-center text-text-2">Vinculacion no encontrada.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-text-3">
        <Link to="/vinculaciones" className="hover:text-accent">Vinculaciones</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text-2">Detalle</span>
      </nav>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-text-1">{vinculacion.oferta_titulo}</h1>
            <Link to={`/ofertas/${vinculacion.oferta_id}`} className="text-sm text-accent hover:underline">
              Ver oferta
            </Link>
          </div>
          <EstadoBadge estado={vinculacion.estado} />
        </div>

        {/* Participantes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
            <Avatar src={vinculacion.oferente_foto} nombre={vinculacion.oferente_nombre} size="md" />
            <div>
              <p className="text-sm font-semibold text-text-1">{vinculacion.oferente_nombre}</p>
              <p className="text-xs text-text-3">Oferente</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
            <Avatar src={vinculacion.buscador_foto} nombre={vinculacion.buscador_nombre} size="md" />
            <div>
              <p className="text-sm font-semibold text-text-1">{vinculacion.buscador_nombre}</p>
              <p className="text-xs text-text-3">Buscador</p>
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="flex flex-wrap gap-4 text-xs text-text-3">
          <span>Creada: {new Date(vinculacion.created_at).toLocaleDateString('es-MX')}</span>
          {vinculacion.aceptada_at && (
            <span>Aceptada: {new Date(vinculacion.aceptada_at).toLocaleDateString('es-MX')}</span>
          )}
          {vinculacion.completada_at && (
            <span>Completada: {new Date(vinculacion.completada_at).toLocaleDateString('es-MX')}</span>
          )}
        </div>

        {/* Panel de confirmacion */}
        <PanelConfirmacion vinculacion={vinculacion} />

        {/* Acciones */}
        {user && (
          <div className="border-t border-border pt-4">
            <AccionesVinculacion vinculacion={vinculacion} userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
