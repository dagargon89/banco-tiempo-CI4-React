import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ImageUpload from '@/components/ui/ImageUpload';
import { useProfile, useUpdateProfile } from './hooks/useProfile';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
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
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fields: Record<string, string> = { nombre };
    if (bio !== (user.bio ?? '')) fields.bio = bio;
    if (zona !== (user.zona ?? '')) fields.zona = zona;
    // foto_perfil se maneja como URL string (subido por separado via Firebase Storage)
    // Para Sprint 2, se guarda como texto simple si el usuario ya tiene una URL

    try {
      await updateProfile.mutateAsync(fields);
      await refreshUser();
      navigate('/perfil');
    } catch {
      // error is handled by mutation state
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-text-1">Editar perfil</h2>

          {updateProfile.error && (
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
              />
              {fotoFile && (
                <p className="mt-1 text-xs text-text-3">
                  La foto seleccionada se subirá en una versión futura. Por ahora puedes editar los demás campos.
                </p>
              )}
            </div>

            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              required
            />

            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..."
              maxChars={500}
              currentLength={bio.length}
            />

            <Input
              label="Zona"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder='Ej: "Centro", "Partido Romero"'
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={updateProfile.isPending || nombre.trim() === ''}>
                {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/perfil')}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
