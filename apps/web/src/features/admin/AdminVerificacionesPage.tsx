import { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { useVerificacionesPendientes } from './hooks/useAdminVerificaciones';
import VerificacionReviewPanel from './components/VerificacionReviewPanel';
import type { VerificacionPendiente } from '@/lib/types';

export default function AdminVerificacionesPage() {
  const { data: pendientes, isLoading } = useVerificacionesPendientes();

  // Agrupar documentos por usuario
  const grouped = useMemo(() => {
    if (!pendientes) return [];
    const map = new Map<number, { userId: number; nombre: string; email: string; foto_perfil: string | null; docs: VerificacionPendiente[] }>();
    for (const doc of pendientes) {
      const existing = map.get(doc.user_id);
      if (existing) {
        existing.docs.push(doc);
      } else {
        map.set(doc.user_id, {
          userId: doc.user_id,
          nombre: doc.nombre,
          email: doc.email,
          foto_perfil: doc.foto_perfil,
          docs: [doc],
        });
      }
    }
    return Array.from(map.values());
  }, [pendientes]);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-text-1">Cola de verificaciones</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-10 w-10" />}
            title="No hay verificaciones pendientes"
            subtitle="Todos los usuarios han sido revisados"
          />
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <VerificacionReviewPanel
                key={g.userId}
                docs={g.docs}
                userId={g.userId}
                userName={g.nombre}
                userEmail={g.email}
                userFoto={g.foto_perfil}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
