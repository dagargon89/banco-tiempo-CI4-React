import { Link } from 'react-router-dom';
import { MapPin, Calendar, User2, Pencil, LayoutGrid, Star, Clock, Phone } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { ProfileHeaderSkeleton } from '@/components/ui/Skeleton';
import VerificacionBadge from '@/components/verificacion/VerificacionBadge';
import VerificacionBanner from '@/components/verificacion/VerificacionBanner';
import { useProfile, useVerificacionEstado } from './hooks/useProfile';
import { useMisOfertas } from '@/features/ofertas/hooks/useOfertas';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useListarVinculaciones } from '@/features/vinculaciones/hooks/useVinculaciones';
import { useResenasDeUsuario } from '@/features/resenas/hooks/useResenas';
import ResenasList from '@/features/resenas/components/ResenasList';
import { getCategoryConfigById } from '@/lib/categoryConfig';

export default function ProfilePage() {
  const { data: user, isLoading } = useProfile();
  const { data: verificacion } = useVerificacionEstado();
  const { data: ofertas } = useMisOfertas();
  const { data: categorias } = useCategorias();
  const { data: completadasData } = useListarVinculaciones({ estado: 'completada', per_page: 50 });

  const { data: resenasData } = useResenasDeUsuario(user?.id);

  const ofertasActivas = ofertas?.filter((o) => o.estado === 'activa') ?? [];
  const completadas = completadasData?.data ?? [];
  const resenasStats = resenasData?.meta?.estadisticas;
  const calificacionPromedio = resenasStats?.promedio ? resenasStats.promedio.toFixed(1) : '—';
  const totalResenas = resenasStats?.total ?? 0;

  if (isLoading || !user) {
    return <ProfileHeaderSkeleton />;
  }

  const fechaRegistro = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
    : '';

  return (
    <>
      {/* Profile Header Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="h-32" style={{ background: 'var(--brand-gradient)' }} />

        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar src={user.foto_perfil} nombre={user.nombre} size="xl" />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-text-1">{user.nombre}</h1>
                  <VerificacionBadge estado={user.estado_verificacion} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-2">
                  {user.zona && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {user.zona}
                    </span>
                  )}
                  {fechaRegistro && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Desde {fechaRegistro}
                    </span>
                  )}
                  {user.fecha_nacimiento && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {new Date(user.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {user.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {user.telefono}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <User2 className="h-3.5 w-3.5" />{' '}
                    {user.roles.length > 0 ? user.roles.join(', ') : 'Usuario'}
                  </span>
                </div>
              </div>
            </div>
            <Link to="/perfil/editar">
              <Button variant="secondary">
                <Pencil className="h-4 w-4" /> Editar perfil
              </Button>
            </Link>
          </div>

          {user.bio && <p className="mt-4 text-sm text-text-2">{user.bio}</p>}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Calificacion" value={calificacionPromedio} accent />
            <StatCard label="Actividades" value={completadas.length} />
            <StatCard label="Resenas" value={totalResenas} />
            <StatCard label="Ofertas" value={ofertasActivas.length} />
          </div>
        </div>
      </div>

      {user.estado_verificacion !== 'verificado' && (
        <div className="mt-4">
          <VerificacionBanner
            estado={user.estado_verificacion}
            motivoRechazo={verificacion?.motivo_rechazo}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text-1">Insignias</h3>
            <EmptyState
              icon={<LayoutGrid className="h-8 w-8" />}
              title="Sin insignias aun"
              subtitle="Participa en la comunidad para ganar insignias"
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text-1">Habilidades que ensena</h3>
            {ofertasActivas.length === 0 ? (
              <EmptyState
                icon={<Star className="h-8 w-8" />}
                title="Sin habilidades publicadas"
                subtitle="Crea una oferta para mostrar tus habilidades"
              />
            ) : (
              <div className="space-y-2">
                {ofertasActivas.map((oferta) => {
                  const catConfig = getCategoryConfigById(oferta.categoria_id, categorias);
                  const Icon = catConfig.icon;
                  return (
                    <Link
                      key={oferta.id}
                      to={`/ofertas/${oferta.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent/30"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${catConfig.accent}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-1">{oferta.titulo}</p>
                        <p className="text-xs text-text-3">{oferta.modalidad}</p>
                      </div>
                      <Badge variant="success">Activa</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text-1">Historial de actividades</h3>
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title="Sin actividad reciente"
              subtitle="Tu historial aparecera aqui cuando participes"
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-text-1">Resenas recibidas</h3>
            {user && <ResenasList userId={user.id} />}
          </div>
        </div>
      </div>
    </>
  );
}
