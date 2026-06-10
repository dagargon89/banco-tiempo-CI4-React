import { useParams, Link, useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import UserName from '@/components/ui/UserName';
import { useOfertaDetalle, useCambiarEstadoOferta } from './hooks/useOfertas';
import { useMarcarInteres } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useAuthStore } from '@/stores/authStore';
import { toast, toastError } from '@/lib/toast';
import { DetalleSkeleton } from '@/components/ui/Skeleton';

export default function OfertaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: oferta, isLoading } = useOfertaDetalle(id!);
  const cambiarEstado = useCambiarEstadoOferta();
  const marcarInteres = useMarcarInteres();

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
        if (estado === 'eliminada') {
          toast.info('Oferta eliminada');
          navigate('/mis-ofertas');
        } else if (estado === 'pausada') {
          toast.info('Oferta pausada');
        } else if (estado === 'activa') {
          toast.success('Oferta reanudada');
        }
      },
      onError: (err) => toastError(err, 'No se pudo cambiar el estado.'),
    });
  };

  const handleMarcarInteres = () => {
    if (!oferta) return;
    marcarInteres.mutate(oferta.id, {
      onSuccess: () => toast.success('Interés registrado. Pronto el oferente verá tu solicitud.'),
      onError: (err) => toastError(err, 'Error al registrar interés.'),
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
      <div className="mx-auto max-w-3xl">
        <DetalleSkeleton />
      </div>
    );
  }

  if (!oferta) {
    return <p className="text-center text-text-2">Oferta no encontrada.</p>;
  }

  const isFlag = (v: unknown): boolean => v === true || v === 1 || v === '1';
  const oferenteInactivo = isFlag((oferta as { oferente_inactivo?: boolean | number | string }).oferente_inactivo);
  const pausadaPorAdmin = isFlag((oferta as { pausada_por_admin?: number | string }).pausada_por_admin);

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

        {(oferenteInactivo || pausadaPorAdmin) && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
            Esta oferta está temporalmente fuera de servicio porque la cuenta del oferente fue dada de baja.
          </div>
        )}

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
            <p className="text-sm font-semibold text-text-1">
              <UserName nombre={oferta.oferente_nombre} inactivo={oferenteInactivo} />
            </p>
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

        {!esDueno && oferta.estado === 'activa' && (
          <>
            {/* Desktop CTA */}
            <div className="hidden border-t border-border pt-4 md:block">
              <Button onClick={handleMarcarInteres} disabled={marcarInteres.isPending || oferenteInactivo}>
                {marcarInteres.isPending ? 'Enviando...' : 'Me interesa'}
              </Button>
            </div>

            {/* Sticky CTA mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 border-t border-border bg-surface px-4 py-3 shadow-lg md:hidden">
              <Avatar src={oferta.oferente_foto} nombre={oferta.oferente_nombre} size="sm" />
              <span className="flex-1 truncate text-sm font-medium text-text-1">
                <UserName nombre={oferta.oferente_nombre} inactivo={oferenteInactivo} />
              </span>
              <Button onClick={handleMarcarInteres} disabled={marcarInteres.isPending || oferenteInactivo}>
                {marcarInteres.isPending ? 'Enviando...' : 'Me interesa'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
