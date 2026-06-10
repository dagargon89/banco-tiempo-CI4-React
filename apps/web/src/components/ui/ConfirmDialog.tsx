import { useState } from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  motivoLabel?: string;
  cascadeCheckLabel?: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: (payload: { motivo?: string }) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  motivoLabel,
  cascadeCheckLabel,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [cascadeChecked, setCascadeChecked] = useState(false);

  if (!open) return null;

  const disabled = (cascadeCheckLabel ? !cascadeChecked : false) || loading;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-text-1">{title}</h2>
        <p className="mt-2 text-sm text-text-2">{message}</p>

        {motivoLabel && (
          <div className="mt-4">
            <label className="text-sm font-medium text-text-1" htmlFor="cd-motivo">{motivoLabel}</label>
            <textarea
              id="cd-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-1"
              rows={3}
            />
            <p className="mt-1 text-xs text-text-3">{motivo.length}/500</p>
          </div>
        )}

        {cascadeCheckLabel && (
          <label className="mt-4 flex items-start gap-2 text-sm text-text-2">
            <input
              type="checkbox"
              checked={cascadeChecked}
              onChange={(e) => setCascadeChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span>{cascadeCheckLabel}</span>
          </label>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={() => onConfirm({ motivo: motivo || undefined })} disabled={disabled}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
