import { useState } from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useResolverVerificacion } from '../hooks/useAdminVerificaciones';
import { api } from '@/lib/api';
import type { VerificacionPendiente } from '@/lib/types';

interface Props {
  docs: VerificacionPendiente[];
  userId: number;
  userName: string;
  userEmail: string;
  userFoto: string | null;
}

export default function VerificacionReviewPanel({ docs, userId, userName, userEmail, userFoto }: Props) {
  const resolver = useResolverVerificacion();
  const [motivo, setMotivo] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<number | null>(null);

  const handleVerDocumento = async (docId: number) => {
    setViewingDoc(docId);
    try {
      const { data } = await api.get<{ data: { url: string } }>(`/admin/verificaciones/${docId}/documento`);
      window.open(data.data.url, '_blank');
    } catch {
      // Silently fail
    } finally {
      setViewingDoc(null);
    }
  };

  const handleAprobar = () => {
    resolver.mutate({ userId, accion: 'aprobar' });
  };

  const handleRechazar = () => {
    if (motivo.trim() === '') return;
    resolver.mutate({ userId, accion: 'rechazar', motivo });
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

      {/* Documents */}
      <div className="mt-4 space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-text-3" />
              <span className="text-sm text-text-1">{doc.tipo_documento.toUpperCase()}</span>
              <span className="text-xs text-text-3">
                {new Date(doc.created_at).toLocaleDateString('es-MX')}
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleVerDocumento(doc.id)}
              disabled={viewingDoc === doc.id}
            >
              {viewingDoc === doc.id ? 'Abriendo...' : 'Ver documento'}
            </Button>
          </div>
        ))}
      </div>

      {/* Actions */}
      {resolver.isSuccess ? (
        <div className="mt-4 rounded-sm border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          Verificación resuelta correctamente.
        </div>
      ) : (
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
