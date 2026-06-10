import { useState } from 'react';
import { FileText, CheckCircle, XCircle, ExternalLink, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useResolverVerificacion } from '../hooks/useAdminVerificaciones';
import { api } from '@/lib/api';
import { toast, toastError } from '@/lib/toast';
import type { VerificacionPendiente } from '@/lib/types';

const GENERO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiere no decir',
};

interface Props {
  docs: VerificacionPendiente[];
  userId: number;
  userName: string;
  userEmail: string;
  userFoto: string | null;
  userFechaNacimiento: string | null;
  userGenero: string | null;
  userTelefono: string | null;
}

export default function VerificacionReviewPanel({ docs, userId, userName, userEmail, userFoto, userFechaNacimiento, userGenero, userTelefono }: Props) {
  const resolver = useResolverVerificacion();
  const [motivo, setMotivo] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<number | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docContentType, setDocContentType] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState<number | null>(null);

  const handleVerDocumento = async (docId: number) => {
    setLoadingDoc(docId);
    try {
      const { data } = await api.get<{ data: { url: string; content_type: string } }>(`/admin/verificaciones/${docId}/documento`);
      setDocUrl(data.data.url);
      setDocContentType(data.data.content_type ?? '');
      setViewingDoc(docId);
    } catch (err) {
      toastError(err, 'Error al obtener el documento. Verifica la configuración de Firebase Storage.');
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleCerrarVisor = () => {
    setDocUrl(null);
    setDocContentType('');
    setViewingDoc(null);
  };

  const isPdf = docContentType === 'application/pdf';

  const handleAprobar = () => {
    resolver.mutate(
      { userId, accion: 'aprobar' },
      {
        onSuccess: () => toast.success(`Verificación aprobada para ${userName}`),
        onError: (err) => toastError(err, 'Error al aprobar la verificación.'),
      },
    );
  };

  const handleRechazar = () => {
    if (motivo.trim() === '') return;
    resolver.mutate(
      { userId, accion: 'rechazar', motivo },
      {
        onSuccess: () => toast.info(`Verificación rechazada para ${userName}`),
        onError: (err) => toastError(err, 'Error al rechazar la verificación.'),
      },
    );
    setShowReject(false);
    setMotivo('');
  };

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <Avatar src={userFoto} nombre={userName} size="md" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text-1">{userName}</p>
          <p className="text-xs text-text-3">{userEmail}</p>
        </div>
        <Badge variant="warning">Pendiente</Badge>
      </div>

      {/* Profile data for cross-validation */}
      <div className="mt-3 rounded-sm border border-border bg-surface-2 px-4 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">Datos del perfil</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <span className="text-text-3">Nacimiento: </span>
            <span className="text-text-1">
              {userFechaNacimiento
                ? new Date(userFechaNacimiento + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-text-3">Género: </span>
            <span className="text-text-1">{userGenero ? (GENERO_LABELS[userGenero] ?? userGenero) : '—'}</span>
          </div>
          <div>
            <span className="text-text-3">Teléfono: </span>
            <span className="text-text-1">{userTelefono || '—'}</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="mt-4 space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="space-y-2">
            <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-text-3" />
                <span className="text-sm text-text-1">{doc.tipo_documento.toUpperCase()}</span>
                <span className="text-xs text-text-3">
                  {new Date(doc.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => viewingDoc === doc.id ? handleCerrarVisor() : handleVerDocumento(doc.id)}
                disabled={loadingDoc === doc.id}
              >
                {loadingDoc === doc.id ? 'Cargando...' : viewingDoc === doc.id ? 'Cerrar' : 'Ver documento'}
              </Button>
            </div>

            {/* Inline document viewer */}
            {viewingDoc === doc.id && docUrl && (
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-text-2">Vista previa del documento</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir en nueva pestaña
                    </a>
                    <button onClick={handleCerrarVisor} className="rounded p-1 text-text-3 hover:bg-surface hover:text-text-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="rounded-md bg-surface-2 p-2">
                  {isPdf ? (
                    <iframe
                      src={docUrl}
                      title={`Documento ${doc.tipo_documento}`}
                      className="h-[600px] w-full rounded border-0"
                    />
                  ) : (
                    <img
                      src={docUrl}
                      alt={`Documento ${doc.tipo_documento}`}
                      className="mx-auto max-h-[600px] rounded object-contain"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      {!resolver.isSuccess && (
        <div className="mt-4">
          {showReject ? (
            <div className="space-y-3">
              <Textarea
                label="Motivo del rechazo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica por qué se rechaza la verificación..."
                maxChars={500}
                currentLength={motivo.length}
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleRechazar}
                  disabled={motivo.trim() === '' || resolver.isPending}
                >
                  {resolver.isPending ? 'Procesando...' : 'Confirmar rechazo'}
                </Button>
                <Button variant="secondary" onClick={() => setShowReject(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleAprobar} disabled={resolver.isPending}>
                <CheckCircle className="h-4 w-4" /> Aprobar
              </Button>
              <Button variant="danger" onClick={() => setShowReject(true)} disabled={resolver.isPending}>
                <XCircle className="h-4 w-4" /> Rechazar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
