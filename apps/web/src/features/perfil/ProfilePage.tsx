import { Link } from 'react-router-dom';
import { MapPin, Calendar, User2, Pencil, LayoutGrid, Star, Clock } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import VerificacionBadge from '@/components/verificacion/VerificacionBadge';
import VerificacionBanner from '@/components/verificacion/VerificacionBanner';
import { useProfile, useVerificacionEstado } from './hooks/useProfile';

export default function ProfilePage() {
  const { data: user, isLoading } = useProfile();
  const { data: verificacion } = useVerificacionEstado();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
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
            <StatCard label="Calificacion" value="—" accent />
            <StatCard label="Actividades" value={0} />
            <StatCard label="Resenas" value={0} />
            <StatCard label="Ofertas" value={0} />
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
            <EmptyState
              icon={<Star className="h-8 w-8" />}
              title="Sin habilidades publicadas"
              subtitle="Crea una oferta para mostrar tus habilidades"
            />
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
            <EmptyState
              icon={<Star className="h-8 w-8" />}
              title="Sin resenas aun"
              subtitle="Las resenas apareceran despues de completar actividades"
            />
          </div>
        </div>
      </div>
    </>
  );
}
