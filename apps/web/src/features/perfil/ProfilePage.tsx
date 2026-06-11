import { Link } from 'react-router-dom';
import {
  MapPin, Calendar, User2, Pencil, LayoutGrid, Star, Clock, Phone,
  GraduationCap, BookOpen, Video, Heart, Languages, Briefcase, Home, MessageSquare,
} from 'lucide-react';
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
import type {
  AniosEnJuarez, ContactoPreferido, DiaSemana, FranjaHoraria, Frecuencia, ModalidadPreferida,
} from '@/lib/types';

const LABEL_MODALIDAD: Record<ModalidadPreferida, string> = {
  presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido',
};
const LABEL_FRANJA: Record<FranjaHoraria, string> = {
  manana: 'Mañana', tarde: 'Tarde', noche: 'Noche', fin_semana: 'Fin de semana',
};
const LABEL_FRECUENCIA: Record<Frecuencia, string> = {
  puntual: 'Puntual', mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal',
};
const LABEL_ANIOS: Record<AniosEnJuarez, string> = {
  menos_1: 'Menos de 1 año en Juárez',
  '1_5': '1 a 5 años en Juárez',
  '5_10': '5 a 10 años en Juárez',
  mas_10: 'Más de 10 años en Juárez',
};
const LABEL_CONTACTO: Record<ContactoPreferido, string> = {
  plataforma: 'Solo en la plataforma',
  email: 'Acepta correo',
  whatsapp: 'Acepta WhatsApp',
};
const DIA_FULL: Record<DiaSemana, string> = {
  L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom',
};
const DIAS_ORDER: DiaSemana[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function ChipList({ items, tone = 'accent' }: { items: string[]; tone?: 'accent' | 'info' | 'neutral' }) {
  if (items.length === 0) return null;
  const styles = {
    accent: 'bg-accent-soft text-accent',
    info: 'bg-info/10 text-info',
    neutral: 'bg-surface-2 text-text-2',
  }[tone];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-pill px-2.5 py-1 text-xs font-medium ${styles}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function InfoCard({
  title, icon, empty, children,
}: {
  title: string;
  icon: React.ReactNode;
  empty?: string;
  children: React.ReactNode;
}) {
  const hasContent = children !== null && children !== false && children !== undefined;
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-1">
        <span className="text-accent">{icon}</span>
        {title}
      </h3>
      {hasContent ? children : <p className="text-xs italic text-text-3">{empty ?? 'Sin información.'}</p>}
    </div>
  );
}

function DayPills({ dias }: { dias: DiaSemana[] | null | undefined }) {
  const active = new Set(dias ?? []);
  return (
    <div className="flex flex-wrap gap-1">
      {DIAS_ORDER.map((d) => (
        <span
          key={d}
          className={`flex h-7 w-9 items-center justify-center rounded-lg text-[11px] font-semibold ${
            active.has(d) ? 'bg-accent text-white' : 'bg-surface-2 text-text-3'
          }`}
        >
          {DIA_FULL[d]}
        </span>
      ))}
    </div>
  );
}

function calcEdad(fecha: string): number {
  const nacimiento = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

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

  const habilidadesEnseno = user.habilidades_enseno ?? [];
  const quiereAprender = user.quiere_aprender ?? [];
  const modalidades = (user.modalidades_preferidas ?? []).map((m) => LABEL_MODALIDAD[m]);
  const franjas = (user.franjas_horarias ?? []).map((f) => LABEL_FRANJA[f]);
  const idiomas = user.idiomas ?? [];
  const causas = user.causas ?? [];

  const tieneIntercambio = habilidadesEnseno.length > 0 || quiereAprender.length > 0 || modalidades.length > 0;
  const tieneDisponibilidad = franjas.length > 0 || (user.dias_disponibles && user.dias_disponibles.length > 0) || !!user.frecuencia;
  const tieneSobreTi = idiomas.length > 0 || causas.length > 0 || !!user.anios_en_juarez || !!user.ocupacion_general || !!user.pronombres;

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
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-text-1">{user.nombre}</h1>
                  {user.pronombres && (
                    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-2">
                      {user.pronombres}
                    </span>
                  )}
                  <VerificacionBadge estado={user.estado_verificacion} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-2">
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
                      <User2 className="h-3.5 w-3.5" /> {calcEdad(user.fecha_nacimiento)} años
                    </span>
                  )}
                  {user.ocupacion_general && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {user.ocupacion_general}
                    </span>
                  )}
                  {user.anios_en_juarez && (
                    <span className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" /> {LABEL_ANIOS[user.anios_en_juarez]}
                    </span>
                  )}
                  {user.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {user.telefono}
                    </span>
                  )}
                  {user.contacto_preferido && user.contacto_preferido !== 'plataforma' && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {LABEL_CONTACTO[user.contacto_preferido]}
                    </span>
                  )}
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

      {/* Mi intercambio */}
      {tieneIntercambio && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="Habilidades que enseño" icon={<GraduationCap className="h-4 w-4" />} empty="Aún no has añadido habilidades.">
            {habilidadesEnseno.length > 0 ? <ChipList items={habilidadesEnseno} /> : null}
          </InfoCard>
          <InfoCard title="Quiero aprender" icon={<BookOpen className="h-4 w-4" />} empty="Aún no has añadido temas.">
            {quiereAprender.length > 0 ? <ChipList items={quiereAprender} tone="info" /> : null}
          </InfoCard>
          <InfoCard title="Modalidades preferidas" icon={<Video className="h-4 w-4" />} empty="Sin modalidades elegidas.">
            {modalidades.length > 0 ? <ChipList items={modalidades} tone="neutral" /> : null}
          </InfoCard>
        </div>
      )}

      {/* Disponibilidad + Sobre mí */}
      {(tieneDisponibilidad || tieneSobreTi) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {tieneDisponibilidad && (
            <InfoCard title="Disponibilidad" icon={<Clock className="h-4 w-4" />}>
              <div className="space-y-3">
                {franjas.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-3">Franjas</p>
                    <ChipList items={franjas} tone="neutral" />
                  </div>
                )}
                {user.dias_disponibles && user.dias_disponibles.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-3">Días</p>
                    <DayPills dias={user.dias_disponibles} />
                  </div>
                )}
                {user.frecuencia && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-3">Frecuencia</p>
                    <p className="text-sm font-medium text-text-1">{LABEL_FRECUENCIA[user.frecuencia]}</p>
                  </div>
                )}
              </div>
            </InfoCard>
          )}
          {tieneSobreTi && (
            <InfoCard title="Sobre mí" icon={<Heart className="h-4 w-4" />}>
              <div className="space-y-3">
                {idiomas.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-3">
                      <Languages className="h-3 w-3" /> Idiomas
                    </p>
                    <ChipList items={idiomas} tone="neutral" />
                  </div>
                )}
                {causas.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-3">
                      <Heart className="h-3 w-3" /> Causas que me importan
                    </p>
                    <ChipList items={causas} tone="info" />
                  </div>
                )}
              </div>
            </InfoCard>
          )}
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
            <h3 className="mb-3 text-sm font-semibold text-text-1">Ofertas activas</h3>
            {ofertasActivas.length === 0 ? (
              <EmptyState
                icon={<Star className="h-8 w-8" />}
                title="Sin ofertas publicadas"
                subtitle="Crea una oferta para que la comunidad la vea"
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
