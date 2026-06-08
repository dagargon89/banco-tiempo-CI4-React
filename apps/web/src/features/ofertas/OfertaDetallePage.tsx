import { useParams, Link, useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useOfertaDetalle, useCambiarEstadoOferta } from './hooks/useOfertas';
import { useAuthStore } from '@/stores/authStore';

export default function OfertaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: oferta, isLoading } = useOfertaDetalle(id!);
  const cambiarEstado = useCambiarEstadoOferta();

  const esDueno = user && oferta && user.id === oferta.user_id;

  const disponibilidad: string[] = (() => {
    if (!oferta?.disponibilidad) return [];
    try {
      const parsed = typeof oferta.disponibilidad === 'string' ? JSON.parse(oferta.disponibilidad) : oferta.disponibilidad;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const handleCambiarEstado = (estado: string) => {
    if (!oferta) return;
    if (estado === 'eliminada' && !confirm('Esta accion no se puede deshacer. Continuar?')) return;
    cambiarEstado.mutate({ id: oferta.id, estado }, {
      onSuccess: () => {
        if (estado === 'eliminada') navigate('/mis-ofertas');
      },
    });
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      activa: 'success', pausada: 'warning', borrador: 'neutral', eliminada: 'error',
    };
    return map[estado] ?? 'neutral';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!oferta) {
    return <p className="text-center text-text-2">Oferta no encontrada.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-text-3">
        <Link to="/" className="hover:text-accent">Explorar</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-text-2">Detalle</span>
      </nav>

      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-xl font-bold text-text-1">{oferta.titulo}</h1>
            <Badge variant={estadoBadge(oferta.estado)}>{oferta.estado}</Badge>
          </div>
          <p className="mt-2 text-sm text-text-2">{oferta.descripcion_breve}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{oferta.modalidad}</Badge>
          {oferta.zona && <Badge variant="neutral">{oferta.zona}</Badge>}
          {oferta.tipo_capacidad && (
            <Badge variant="neutral">
              {oferta.tipo_capacidad === 'grupal' ? `Grupal (max ${oferta.capacidad_maxima})` : 'Individual'}
            </Badge>
          )}
        </div>

        {oferta.descripcion_completa && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-text-1">Descripcion</h2>
            <p className="whitespace-pre-line text-sm text-text-2">{oferta.descripcion_completa}</p>
          </div>
        )}

        {disponibilidad.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-text-1">Disponibilidad</h2>
            <div className="flex flex-wrap gap-2">
              {disponibilidad.map((d) => (
                <Badge key={d} variant="neutral">{d}</Badge>
              ))}
            </div>
          </div>
        )}

        {oferta.imagenes && oferta.imagenes.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-text-1">Imagenes</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {oferta.imagenes.map((img) => (
                <img key={img.id} src={img.ruta} alt="" className="rounded-sm border border-border object-cover" />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="md" />
          <div>
            <p className="text-sm font-semibold text-text-1">{oferta.oferente_nombre}</p>
            <p className="text-xs text-text-3">Oferente</p>
          </div>
        </div>

        {esDueno && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Link to={`/ofertas/${oferta.id}/editar`}>
              <Button variant="secondary">Editar</Button>
            </Link>
            {oferta.estado === 'activa' && (
              <Button variant="secondary" onClick={() => handleCambiarEstado('pausada')} disabled={cambiarEstado.isPending}>
                Pausar
              </Button>
            )}
            {oferta.estado === 'pausada' && (
              <Button variant="primary" onClick={() => handleCambiarEstado('activa')} disabled={cambiarEstado.isPending}>
                Reanudar
              </Button>
            )}
            {oferta.estado !== 'eliminada' && (
              <Button variant="danger" onClick={() => handleCambiarEstado('eliminada')} disabled={cambiarEstado.isPending}>
                Eliminar
              </Button>
            )}
          </div>
        )}

        {!esDueno && (
          <div className="border-t border-border pt-4">
            <Button disabled>Me interesa (proximamente)</Button>
          </div>
        )}
      </div>
    </div>
  );
}
