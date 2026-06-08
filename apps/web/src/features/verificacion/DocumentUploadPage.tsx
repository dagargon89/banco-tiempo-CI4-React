import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSubirDocumento } from './hooks/useVerificacion';
import { useAuthStore } from '@/stores/authStore';
import type { TipoDocumento } from '@/lib/types';

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'ine', label: 'INE / IFE' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia', label: 'Licencia de conducir' },
  { value: 'otro', label: 'Otro documento oficial' },
];

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

type Step = 'tipo' | 'archivo' | 'preview' | 'subiendo' | 'exito';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const subirDocumento = useSubirDocumento();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [step, setStep] = useState<Step>('tipo');
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    if (!ACCEPTED_TYPES.includes(f.type)) { setError('Tipo de archivo no permitido. Usa JPEG, PNG o PDF.'); return; }
    if (f.size > MAX_SIZE) { setError('El archivo debe ser menor a 10MB.'); return; }
    setFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setStep('preview');
  };

  const handleUpload = async () => {
    if (!file || !tipoDoc) return;
    setStep('subiendo');
    setError('');

    try {
      await subirDocumento.mutateAsync({ archivo: file, tipo_documento: tipoDoc, content_type: file.type, size: file.size });
      await refreshUser();
      setStep('exito');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error al subir el documento.');
      setStep('preview');
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-text-1">Verificación de identidad</h2>
        <p className="mb-6 text-sm text-text-2">
          Sube un documento oficial para verificar tu identidad. Tu documento será cifrado antes de enviarse.
        </p>

        {error && (
          <div className="mb-4 rounded-sm border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        )}

        {step === 'tipo' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-1">Selecciona el tipo de documento:</p>
            {TIPOS_DOCUMENTO.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTipoDoc(t.value); setStep('archivo'); }}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-accent hover:bg-accent-soft ${tipoDoc === t.value ? 'border-accent bg-accent-soft' : 'border-border'}`}
              >
                <FileText className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-text-1">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'archivo' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-1">Tipo: {TIPOS_DOCUMENTO.find((t) => t.value === tipoDoc)?.label}</p>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-accent/50 hover:bg-accent-soft/30">
              <Upload className="mb-3 h-10 w-10 text-text-3" />
              <p className="text-sm font-medium text-text-1">Haz clic para seleccionar archivo</p>
              <p className="mt-1 text-xs text-text-3">JPEG, PNG o PDF — max. 10MB</p>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileSelect} />
            </label>
            <Button variant="secondary" onClick={() => setStep('tipo')}>Atrás</Button>
          </div>
        )}

        {step === 'preview' && file && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-1">Archivo seleccionado:</p>
            <div className="rounded-lg border border-border p-4">
              {preview ? (
                <img src={preview} alt="Preview" className="mx-auto max-h-60 rounded-md object-contain" />
              ) : (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text-1">{file.name}</p>
                    <p className="text-xs text-text-3">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleUpload}>Subir documento</Button>
              <Button variant="secondary" onClick={() => setStep('archivo')}>Cambiar archivo</Button>
            </div>
          </div>
        )}

        {step === 'subiendo' && (
          <div className="flex flex-col items-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <p className="mt-4 text-sm text-text-2">Cifrando y subiendo tu documento...</p>
          </div>
        )}

        {step === 'exito' && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="mt-4 text-sm font-medium text-text-1">Documento enviado correctamente</p>
            <p className="mt-1 text-xs text-text-2">Un moderador revisara tu identidad pronto.</p>
            <Button className="mt-6" onClick={() => navigate('/perfil')}>Ir a mi perfil</Button>
          </div>
        )}
      </div>
    </div>
  );
}
