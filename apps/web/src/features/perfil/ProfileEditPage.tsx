import { type FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ImageUpload from '@/components/ui/ImageUpload';
import { useProfile, useUpdateProfile, useUploadFoto } from './hooks/useProfile';
import { useAuthStore } from '@/stores/authStore';
import { toast, toastError } from '@/lib/toast';
import Skeleton from '@/components/ui/Skeleton';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadFoto = useUploadFoto();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [nombre, setNombre] = useState('');
  const [bio, setBio] = useState('');
  const [zona, setZona] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre);
      setBio(user.bio ?? '');
      setZona(user.zona ?? '');
      setFechaNacimiento(user.fecha_nacimiento ?? '');
      setGenero(user.genero ?? '');
      setTelefono(user.telefono ?? '');
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="space-y-5 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton variant="circle" className="h-24 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const saving = updateProfile.isPending || uploadFoto.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (fotoFile) {
        await uploadFoto.mutateAsync(fotoFile);
      }

      const fields: Record<string, string> = { nombre, bio, zona, fecha_nacimiento: fechaNacimiento, genero, telefono };
      await updateProfile.mutateAsync(fields);

      await refreshUser();
      toast.success('Perfil actualizado');
      navigate('/perfil');
    } catch (err) {
      toastError(err, 'Error al actualizar el perfil.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-text-1">Editar perfil</h2>

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

          <Input
            label="Fecha de nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-1">Género</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Seleccionar...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>
          </div>

          <Input
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: +52 614 123 4567"
          />

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
