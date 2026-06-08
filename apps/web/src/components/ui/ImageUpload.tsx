import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  currentUrl?: string | null;
  onSelect: (file: File) => void;
  maxSizeMB?: number;
  accept?: string;
  uploading?: boolean;
}

export default function ImageUpload({
  currentUrl,
  onSelect,
  maxSizeMB = 5,
  accept = 'image/jpeg,image/png',
  uploading,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      setError('');
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`El archivo debe ser menor a ${maxSizeMB}MB.`);
        return;
      }
      if (!accept.split(',').some((t) => file.type === t.trim())) {
        setError('Tipo de archivo no permitido.');
        return;
      }
      setPreview(URL.createObjectURL(file));
      onSelect(file);
    },
    [maxSizeMB, accept, onSelect],
  );

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors ${
          dragOver ? 'border-accent bg-accent-soft' : 'border-border hover:border-accent/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Preview" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-text-3" />
            <p className="text-sm text-text-2">Haz clic o arrastra una imagen</p>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
