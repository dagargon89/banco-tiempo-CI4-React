import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import UserName from '@/components/ui/UserName';
import PageHeader from '@/components/ui/PageHeader';
import { useBubbleStore } from '@/stores/bubbleStore';
import AccionesVinculacion from './components/AccionesVinculacion';
import PanelConfirmacion from './components/PanelConfirmacion';
import ChatWindow from '@/features/chat/components/ChatWindow';
import ResenaForm from '@/features/resenas/components/ResenaForm';
import { useVinculacionDetalle } from './hooks/useVinculaciones';
import { useResenasDeUsuario } from '@/features/resenas/hooks/useResenas';
import { useAuthStore } from '@/stores/authStore';
import { DetalleSkeleton } from '@/components/ui/Skeleton';
import { contraparte, etiquetaEstado, papelEn } from '@/lib/intercambio';

const PASOS = ['Pedido', 'En curso', 'Terminado'] as const;

function pasoActual(estado: string): number {
  if (estado === 'solicitada') return 0;
  if (estado === 'aceptada') return 1;
  return 2;
}

export default function VinculacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: v, isLoading } = useVinculacionDetalle(id!);
  const { data: resenasData } = useResenasDeUsuario(user?.id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <DetalleSkeleton />
      </div>
    );
  }

  if (!v || !user) {
    return <p className="text-center text-text-2">No encontramos este intercambio.</p>;
  }

  const papel = papelEn(v, user.id);
  const otro = contraparte(v, papel);
  const isFlag = (x: unknown): boolean => x === true || x === 1 || x === '1';
  const otroInactivo = isFlag(otro.inactivo);
  const cerrado = v.estado === 'rechazada' || v.estado === 'cancelada';
  const paso = pasoActual(v.estado);
  const conChat = v.estado === 'aceptada' || v.estado === 'completada';
  const yaReseno = (resenasData?.data ?? []).some((r) => r.vinculacion_id === v.id && r.autor_id === user.id);
  const volver = papel === 'ensenando' ? { to: '/ensenando', label: 'Enseñando' } : { to: '/aprendiendo', label: 'Aprendiendo' };

  const abrirBurbuja = () => {
    const c = papel === 'ensenando'
      ? { id: v.buscador_id, nombre: v.buscador_nombre, foto: v.buscador_foto }
      : { id: v.oferente_id, nombre: v.oferente_nombre, foto: v.oferente_foto };
    useBubbleStore.getState().abrir({ vinculacionId: v.id, contraparte: c, ofertaTitulo: v.oferta_titulo, otroInactivo });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={
          <Link to={volver.to} className="inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {volver.label}
          </Link>
        }
        title={v.oferta_titulo}
        subtitle={
          <>
            {papel === 'ensenando' ? 'Enseñas a ' : 'Aprendes con '}
            <span className="text-text-1"><UserName nombre={otro.nombre} inactivo={otro.inactivo} /></span>.{' '}
            <Link to={`/ofertas/${v.oferta_id}`} className="text-accent hover:underline">Ver la oferta</Link>
          </>
        }
      />

      {/* Avance: es una secuencia real, por eso va numerado */}
      {cerrado ? (
        <p className="mb-8 rounded-2xl border border-border bg-surface-2 px-5 py-4 text-text-2">
          {etiquetaEstado(v.estado, papel)}. Este intercambio ya no sigue.
        </p>
      ) : (
        <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Avance del intercambio">
          {PASOS.map((nombre, i) => {
            const hecho = i < paso || (i === 2 && v.estado === 'completada');
            const actual = i === paso && v.estado !== 'completada';
            return (
              <li key={nombre} aria-current={actual ? 'step' : undefined}>
                <div className={`h-1.5 rounded-full ${hecho || actual ? 'bg-accent' : 'bg-border'}`} />
                <p className={`mt-2 text-sm ${actual ? 'font-medium text-text-1' : 'text-text-2'}`}>
                  {i + 1}. {nombre}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {otroInactivo && (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          La cuenta de {otro.nombre.split(' ')[0]} fue dada de baja. Este intercambio no puede avanzar.
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {conChat ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-medium text-text-1">Mensajes</h2>
                <button
                  onClick={abrirBurbuja}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-2 hover:text-text-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Abrir en ventana flotante
                </button>
              </div>
              <ChatWindow vinculacionId={v.id} otroInactivo={otroInactivo} />
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-strong p-6 text-text-2">
              {v.estado === 'solicitada'
                ? papel === 'ensenando'
                  ? `${otro.nombre.split(' ')[0]} quiere aprender esto contigo. Si aceptas, se abre un chat para que se pongan de acuerdo.`
                  : `Le avisamos a ${otro.nombre.split(' ')[0]}. Cuando acepte, aquí se abre el chat.`
                : 'El chat se cerró porque el intercambio no siguió.'}
            </div>
          )}

          {v.estado === 'completada' && !yaReseno && <ResenaForm vinculacionId={v.id} />}
        </div>

        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <Avatar src={otro.foto} nombre={otro.nombre} size="lg" />
              <div className="min-w-0">
                <p className="text-sm text-text-2">{papel === 'ensenando' ? 'Aprende contigo' : 'Te enseña'}</p>
                <p className="truncate font-medium text-text-1"><UserName nombre={otro.nombre} inactivo={otro.inactivo} /></p>
              </div>
            </div>
            <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-text-2">Pedido</dt><dd className="text-text-1">{new Date(v.created_at).toLocaleDateString('es-MX')}</dd></div>
              {v.aceptada_at && <div className="flex justify-between gap-2"><dt className="text-text-2">Aceptado</dt><dd className="text-text-1">{new Date(v.aceptada_at).toLocaleDateString('es-MX')}</dd></div>}
              {v.completada_at && <div className="flex justify-between gap-2"><dt className="text-text-2">Terminado</dt><dd className="text-text-1">{new Date(v.completada_at).toLocaleDateString('es-MX')}</dd></div>}
            </dl>
          </div>

          <PanelConfirmacion vinculacion={v} papel={papel} />

          {!cerrado && v.estado !== 'completada' && (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <AccionesVinculacion vinculacion={v} userId={user.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
