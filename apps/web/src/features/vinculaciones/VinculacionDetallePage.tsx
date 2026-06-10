import { useParams, Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import UserName from '@/components/ui/UserName';
import EstadoBadge from './components/EstadoBadge';
import AccionesVinculacion from './components/AccionesVinculacion';
import PanelConfirmacion from './components/PanelConfirmacion';
import ChatWindow from '@/features/chat/components/ChatWindow';
import ResenaForm from '@/features/resenas/components/ResenaForm';
import { useVinculacionDetalle } from './hooks/useVinculaciones';
import { useResenasDeUsuario } from '@/features/resenas/hooks/useResenas';
import { useAuthStore } from '@/stores/authStore';
import { DetalleSkeleton } from '@/components/ui/Skeleton';

export default function VinculacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: vinculacion, isLoading } = useVinculacionDetalle(id!);
  const { data: resenasData } = useResenasDeUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <DetalleSkeleton />
      </div>
    );
  }

  if (!vinculacion) {
    return <p className="text-center text-text-2">Vinculacion no encontrada.</p>;
  }

  const isInactivo = (v: unknown): boolean => v === true || v === 1 || v === '1';
  const oferenteInactivo = isInactivo(vinculacion.oferente_inactivo);
  const buscadorInactivo = isInactivo(vinculacion.buscador_inactivo);
  const otroInactivo = user
    ? (Number(user.id) === Number(vinculacion.oferente_id) ? buscadorInactivo : oferenteInactivo)
    : false;

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
              <p className="text-sm font-semibold text-text-1">
                <UserName nombre={vinculacion.oferente_nombre} inactivo={vinculacion.oferente_inactivo} />
              </p>
              <p className="text-xs text-text-3">Oferente</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
            <Avatar src={vinculacion.buscador_foto} nombre={vinculacion.buscador_nombre} size="md" />
            <div>
              <p className="text-sm font-semibold text-text-1">
                <UserName nombre={vinculacion.buscador_nombre} inactivo={vinculacion.buscador_inactivo} />
              </p>
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

        {/* Banner inactivo */}
        {(oferenteInactivo || buscadorInactivo) && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
            Uno de los participantes fue dado de baja. No es posible avanzar esta vinculación.
          </div>
        )}

        {/* Panel de confirmacion */}
        <PanelConfirmacion vinculacion={vinculacion} />

        {/* Chat — visible en estado aceptada o completada */}
        {(vinculacion.estado === 'aceptada' || vinculacion.estado === 'completada') && (
          <ChatWindow vinculacionId={vinculacion.id} otroInactivo={otroInactivo} />
        )}

        {/* Resena — visible en estado completada si el usuario aun no ha resenado esta vinculacion */}
        {vinculacion.estado === 'completada' && user && (() => {
          const yaReseno = (resenasData?.data ?? []).some(
            (r) => r.vinculacion_id === vinculacion.id && r.autor_id === user.id,
          );
          return !yaReseno ? <ResenaForm vinculacionId={vinculacion.id} /> : null;
        })()}

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
