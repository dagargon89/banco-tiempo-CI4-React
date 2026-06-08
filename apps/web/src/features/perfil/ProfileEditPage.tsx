import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ImageUpload from '@/components/ui/ImageUpload';
import { useProfile, useUpdateProfile, useUploadFoto } from './hooks/useProfile';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadFoto = useUploadFoto();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const [zona, setZona] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre);
      setBio(user.bio ?? '');
      setZona(user.zona ?? '');
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const saving = updateProfile.isPending || uploadFoto.isPending;
  const error = updateProfile.error || uploadFoto.error;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (fotoFile) {
        await uploadFoto.mutateAsync(fotoFile);
      }

      const fields: Record<string, string> = { nombre, bio, zona };
      await updateProfile.mutateAsync(fields);

      await refreshUser();
      navigate('/perfil');
    } catch {
      // error se muestra via mutation state
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-text-1">Editar perfil</h2>

        {error && (
          <div className="mb-4 rounded-sm border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            Error al actualizar el perfil. Intenta de nuevo.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-1">Foto de perfil</label>
            <ImageUpload
              currentUrl={user.foto_perfil}
              onSelect={setFotoFile}
              uploading={uploadFoto.isPending}
            />
          </div>

          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" required />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Cuentanos sobre ti..."
            maxChars={500}
            currentLength={bio.length}
          />

          <Input label="Zona" value={zona} onChange={(e) => setZona(e.target.value)} placeholder='Ej: "Centro", "Partido Romero"' />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving || nombre.trim() === ''}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/perfil')}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
