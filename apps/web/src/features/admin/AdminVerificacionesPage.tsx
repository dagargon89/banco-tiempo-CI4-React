import { useState, useMemo } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import VerificacionReviewPanel from './components/VerificacionReviewPanel';
import { useVerificacionesPendientes } from './hooks/useAdminVerificaciones';
import type { VerificacionPendiente } from '@/lib/types';

interface GroupedUser {
  userId: number;
  nombre: string;
  email: string;
  foto_perfil: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  docs: VerificacionPendiente[];
  oldest: Date;
}

function getUrgency(date: Date): 'success' | 'warning' | 'error' {
  const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (hours > 48) return 'error';
  if (hours > 24) return 'warning';
  return 'success';
}

export default function AdminVerificacionesPage() {
  const { data: pendientes, isLoading } = useVerificacionesPendientes();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const grouped = useMemo(() => {
    if (!pendientes) return [];
    const map = new Map<number, GroupedUser>();
    for (const doc of pendientes) {
      const existing = map.get(doc.user_id);
      if (existing) {
        existing.docs.push(doc);
        const docDate = new Date(doc.created_at);
        if (docDate < existing.oldest) existing.oldest = docDate;
      } else {
        map.set(doc.user_id, {
          userId: doc.user_id,
          nombre: doc.nombre,
          email: doc.email,
          foto_perfil: doc.foto_perfil,
          fecha_nacimiento: doc.fecha_nacimiento,
          genero: doc.genero,
          telefono: doc.telefono,
          docs: [doc],
          oldest: new Date(doc.created_at),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.oldest.getTime() - b.oldest.getTime());
  }, [pendientes]);

  const selected = grouped.find((g) => g.userId === selectedUserId) ?? grouped[0] ?? null;
  const urgentCount = grouped.filter((g) => getUrgency(g.oldest) !== 'success').length;

  if (isLoading) {
    return (
      <>
        <h1 className="mb-6 text-2xl font-bold text-text-1">Cola de verificaciones</h1>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  if (grouped.length === 0) {
    return (
      <>
        <h1 className="mb-6 text-2xl font-bold text-text-1">Cola de verificaciones</h1>
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" />}
          title="No hay verificaciones pendientes"
          subtitle="Todos los usuarios han sido revisados"
        />
      </>
    );
  }

  return (
    <>
      {/* Header with counter */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-1">Cola de verificaciones</h1>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="warning">{grouped.length} pendientes</Badge>
          {urgentCount > 0 && (
            <Badge variant="error">
              <Clock className="mr-1 inline h-3 w-3" />{urgentCount} urgentes
            </Badge>
          )}
        </div>
      </div>

      {/* Split view: mobile stacked, desktop side-by-side */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left panel — user list */}
        <div className="shrink-0 space-y-1 lg:w-80">
          {grouped.map((g) => {
            const isActive = selected?.userId === g.userId;
            const urgency = getUrgency(g.oldest);
            return (
              <button
                key={g.userId}
                onClick={() => setSelectedUserId(g.userId)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                  isActive ? 'bg-accent/10 border border-accent/30' : 'border border-transparent hover:bg-surface-2'
                }`}
              >
                <Avatar src={g.foto_perfil} nombre={g.nombre} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${isActive ? 'text-accent' : 'text-text-1'}`}>{g.nombre}</p>
                  <p className="truncate text-xs text-text-3">{g.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={urgency === 'error' ? 'error' : urgency === 'warning' ? 'warning' : 'neutral'}>
                    {g.docs.length} doc{g.docs.length > 1 ? 's' : ''}
                  </Badge>
                  <span className="text-[10px] text-text-3">
                    {g.oldest.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right panel — review detail */}
        <div className="min-w-0 flex-1">
          {selected && (
            <VerificacionReviewPanel
              key={selected.userId}
              docs={selected.docs}
              userId={selected.userId}
              userName={selected.nombre}
              userEmail={selected.email}
              userFoto={selected.foto_perfil}
              userFechaNacimiento={selected.fecha_nacimiento}
              userGenero={selected.genero}
              userTelefono={selected.telefono}
            />
          )}
        </div>
      </div>
    </>
  );
}
