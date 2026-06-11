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
import type {
  AniosEnJuarez,
  AuthUser,
  ContactoPreferido,
  DiaSemana,
  FranjaHoraria,
  Frecuencia,
  ModalidadPreferida,
} from '@/lib/types';

const MODALIDADES: { value: ModalidadPreferida; label: string }[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrido', label: 'Híbrido' },
];

const FRANJAS: { value: FranjaHoraria; label: string }[] = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
  { value: 'fin_semana', label: 'Fin de semana' },
];

const DIAS: { value: DiaSemana; label: string }[] = [
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
  { value: 'X', label: 'X' },
  { value: 'J', label: 'J' },
  { value: 'V', label: 'V' },
  { value: 'S', label: 'S' },
  { value: 'D', label: 'D' },
];

const IDIOMAS_SUGERIDOS = ['Español', 'Inglés', 'Francés', 'Portugués', 'Náhuatl', 'Rarámuri', 'LSM'];
const CAUSAS_SUGERIDAS = ['Educación', 'Medio ambiente', 'Arte y cultura', 'Salud comunitaria', 'Deporte', 'Equidad de género', 'Niñez y juventud', 'Personas mayores'];

function Chip<T extends string>({ value, active, onClick, children }: { value: T; active: boolean; onClick: (v: T) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-pill border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-text-2 hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  );
}

function TagInput({ tags, onChange, suggestions, placeholder }: { tags: string[]; onChange: (t: string[]) => void; suggestions?: string[]; placeholder?: string }) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || tags.includes(v) || tags.length >= 12) return;
    onChange([...tags, v]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-accent hover:text-accent-hover" aria-label={`Quitar ${t}`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder={placeholder ?? 'Añade y presiona Enter'}
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button type="button" onClick={() => add(draft)} className="rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-2 hover:bg-surface-2">
          Añadir
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !tags.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-pill border border-dashed border-border px-2.5 py-0.5 text-[11px] text-text-3 hover:border-accent hover:text-accent">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <header>
        <h3 className="text-sm font-semibold text-text-1">{title}</h3>
        {subtitle && <p className="text-xs text-text-3">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex-1">
        <p className="text-sm font-medium text-text-1">{label}</p>
        {hint && <p className="text-xs text-text-3">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border-strong'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

function toggleInArray<T>(arr: T[] | null | undefined, v: T): T[] {
  const list = arr ?? [];
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadFoto = useUploadFoto();
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [form, setForm] = useState<Partial<AuthUser>>({});
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) setForm(user);
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

  const set = <K extends keyof AuthUser>(key: K, val: AuthUser[K]) => setForm((f) => ({ ...f, [key]: val }));

  const saving = updateProfile.isPending || uploadFoto.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (fotoFile) await uploadFoto.mutateAsync(fotoFile);
      await updateProfile.mutateAsync(form);
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Básico */}
          <Section title="Datos básicos">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-1">Foto de perfil</label>
              <ImageUpload currentUrl={user.foto_perfil} onSelect={setFotoFile} uploading={uploadFoto.isPending} />
            </div>

            <Input label="Nombre" value={form.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} required />

            <Textarea
              label="Bio"
              value={form.bio ?? ''}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Cuéntanos sobre ti..."
              maxChars={500}
              currentLength={(form.bio ?? '').length}
            />

            <Input label="Zona (general)" value={form.zona ?? ''} onChange={(e) => set('zona', e.target.value)} placeholder='Ej: "Centro", "Partido Romero"' />
            <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento ?? ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-1">Género</label>
              <select
                value={form.genero ?? ''}
                onChange={(e) => set('genero', (e.target.value || null) as AuthUser['genero'])}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>

            <Input label="Teléfono" type="tel" value={form.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} placeholder="+52 614 123 4567" />

            <Input label="Pronombres" value={form.pronombres ?? ''} onChange={(e) => set('pronombres', e.target.value)} placeholder='Ej: "ella", "él", "elle"' />
          </Section>

          {/* Grupo A — matchmaking */}
          <Section title="Tu intercambio" subtitle="Ayuda a otras personas a encontrarte.">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Modalidades preferidas</label>
              <div className="flex flex-wrap gap-2">
                {MODALIDADES.map(({ value, label }) => (
                  <Chip key={value} value={value} active={(form.modalidades_preferidas ?? []).includes(value)} onClick={() => set('modalidades_preferidas', toggleInArray(form.modalidades_preferidas, value))}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Habilidades que enseño</label>
              <TagInput tags={form.habilidades_enseno ?? []} onChange={(t) => set('habilidades_enseno', t)} placeholder='Ej: "guitarra acústica"' />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Lo que quiero aprender</label>
              <TagInput tags={form.quiere_aprender ?? []} onChange={(t) => set('quiere_aprender', t)} placeholder='Ej: "francés básico"' />
            </div>
          </Section>

          {/* Grupo B — disponibilidad */}
          <Section title="Disponibilidad" subtitle="Solo a nivel general, nunca tu agenda.">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Franjas horarias</label>
              <div className="flex flex-wrap gap-2">
                {FRANJAS.map(({ value, label }) => (
                  <Chip key={value} value={value} active={(form.franjas_horarias ?? []).includes(value)} onClick={() => set('franjas_horarias', toggleInArray(form.franjas_horarias, value))}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Días disponibles</label>
              <div className="flex gap-1.5">
                {DIAS.map(({ value, label }) => {
                  const active = (form.dias_disponibles ?? []).includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('dias_disponibles', toggleInArray(form.dias_disponibles, value))}
                      className={`h-9 w-9 rounded-lg border text-xs font-semibold transition-colors ${active ? 'border-accent bg-accent text-white' : 'border-border bg-surface text-text-2 hover:bg-surface-2'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-1">Frecuencia con que puedo participar</label>
              <select
                value={form.frecuencia ?? ''}
                onChange={(e) => set('frecuencia', (e.target.value || null) as Frecuencia | null)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Seleccionar...</option>
                <option value="puntual">Puntual</option>
                <option value="mensual">Mensual</option>
                <option value="quincenal">Quincenal</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
          </Section>

          {/* Grupo C+E — identidad / trayectoria */}
          <Section title="Sobre ti">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Idiomas que hablo</label>
              <TagInput tags={form.idiomas ?? []} onChange={(t) => set('idiomas', t)} suggestions={IDIOMAS_SUGERIDOS} placeholder="Añade un idioma" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-3">Causas que me importan</label>
              <TagInput tags={form.causas ?? []} onChange={(t) => set('causas', t)} suggestions={CAUSAS_SUGERIDAS} placeholder="Añade una causa" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-1">Años viviendo en Juárez</label>
              <select
                value={form.anios_en_juarez ?? ''}
                onChange={(e) => set('anios_en_juarez', (e.target.value || null) as AniosEnJuarez | null)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Seleccionar...</option>
                <option value="menos_1">Menos de 1 año</option>
                <option value="1_5">1 a 5 años</option>
                <option value="5_10">5 a 10 años</option>
                <option value="mas_10">Más de 10 años</option>
              </select>
            </div>

            <Input label="Ocupación general" value={form.ocupacion_general ?? ''} onChange={(e) => set('ocupacion_general', e.target.value)} placeholder='Ej: "estudiante", "diseñador", "jubilado"' />
            <p className="-mt-3 text-xs text-text-3">Sin nombre de empresa ni datos específicos.</p>
          </Section>

          {/* Grupo D — privacidad */}
          <Section title="Privacidad" subtitle="Tú decides qué se muestra a otras personas.">
            <Toggle checked={!!form.mostrar_edad} onChange={(v) => set('mostrar_edad', v)} label="Mostrar mi edad en el perfil público" hint="Calculada desde tu fecha de nacimiento, sin mostrar el día exacto." />
            <Toggle checked={!!form.mostrar_zona} onChange={(v) => set('mostrar_zona', v)} label="Mostrar mi zona (Centro, Partido Romero, etc.)" />
            <Toggle checked={!!form.mostrar_habilidades} onChange={(v) => set('mostrar_habilidades', v)} label="Mostrar mis habilidades y lo que quiero aprender" />
            <Toggle checked={!!form.permitir_contacto_directo} onChange={(v) => set('permitir_contacto_directo', v)} label="Permitir que me contacten sin solicitud previa" hint="Si lo apagas, solo aceptaremos contacto al confirmar una vinculación." />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-1">Vía de contacto preferida</label>
              <select
                value={form.contacto_preferido ?? 'plataforma'}
                onChange={(e) => set('contacto_preferido', e.target.value as ContactoPreferido)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="plataforma">Solo dentro de la plataforma</option>
                <option value="email">Aceptar correo electrónico</option>
                <option value="whatsapp">Aceptar WhatsApp</option>
              </select>
            </div>
          </Section>

          {/* Acciones */}
          <div className="flex gap-3 border-t border-border pt-5">
            <Button type="submit" disabled={saving || (form.nombre ?? '').trim() === ''}>
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
