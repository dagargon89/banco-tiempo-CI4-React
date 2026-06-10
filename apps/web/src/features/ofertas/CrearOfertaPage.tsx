import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import OfertaCardComponent from './components/OfertaCardComponent';
import { useCategorias } from './hooks/useCategorias';
import { useCrearOferta } from './hooks/useOfertas';
import { useAuthStore } from '@/stores/authStore';
import { toast, toastError } from '@/lib/toast';
import type { OfertaFormData, Modalidad, TipoCapacidad } from '@/lib/types';

const steps = [
  { label: 'Descripcion', title: '¿Que ofreces?' },
  { label: 'Detalles', title: '¿Como lo ofreces?' },
  { label: 'Publicar', title: 'Revisa y publica' },
];

export default function CrearOfertaPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: categorias } = useCategorias();
  const crearOferta = useCrearOferta();

  const [step, setStep] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [categoriaId, setCategoriaId] = useState<number>(0);
  const [descripcionBreve, setDescripcionBreve] = useState('');
  const [descripcionCompleta, setDescripcionCompleta] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [zona, setZona] = useState('');
  const [tipoCapacidad, setTipoCapacidad] = useState<TipoCapacidad>('individual');
  const [capacidadMaxima, setCapacidadMaxima] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);

  const toggleDisponibilidad = (val: string) => {
    setDisponibilidad((prev) => prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]);
  };

  const canNext = () => {
    if (step === 0) return titulo.trim().length > 0 && categoriaId > 0 && descripcionBreve.length >= 20;
    if (step === 1) return modalidad && (modalidad === 'virtual' || zona.trim().length > 0);
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const datos: OfertaFormData = {
      titulo,
      categoria_id: categoriaId,
      descripcion_breve: descripcionBreve,
      descripcion_completa: descripcionCompleta || undefined,
      modalidad,
      zona: modalidad === 'presencial' ? zona : undefined,
      tipo_capacidad: tipoCapacidad,
      capacidad_maxima: tipoCapacidad === 'grupal' && capacidadMaxima ? Number(capacidadMaxima) : undefined,
      disponibilidad: disponibilidad.length > 0 ? disponibilidad : undefined,
    };

    crearOferta.mutate(datos, {
      onSuccess: (oferta) => {
        toast.success('Oferta publicada');
        navigate(`/ofertas/${oferta.id}`);
      },
      onError: (err) => toastError(err, 'Error al crear la oferta.'),
    });
  };

  const previewCard = {
    id: 0,
    titulo: titulo || 'Titulo de la oferta',
    descripcion_breve: descripcionBreve || 'Descripcion breve de lo que ofreces',
    modalidad,
    zona: zona || null,
    categoria_id: categoriaId,
    oferente_id: user?.id ?? 0,
    oferente_nombre: user?.nombre ?? '',
    oferente_foto: user?.foto_perfil ?? null,
    oferente_calif: null,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 font-display text-xl font-bold text-text-1">Nueva oferta</h1>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < step ? 'bg-accent text-white' : i === step ? 'bg-accent text-white' : 'bg-surface-2 text-text-3'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:inline ${i <= step ? 'text-text-1' : 'text-text-3'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`mx-2 h-0.5 w-8 rounded-full sm:w-16 ${i < step ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
        <p className="text-sm text-text-2">Paso {step + 1} de {steps.length} — {steps[step].title}</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6">
        {/* Step 1: Description */}
        {step === 0 && (
          <div className="space-y-5">
            <Input label="Titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={140} required />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-1">Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                required
              >
                <option value={0} disabled>Selecciona una categoria</option>
                {categorias?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <Textarea
              label="Descripcion breve (20-200 caracteres)"
              value={descripcionBreve}
              onChange={(e) => setDescripcionBreve(e.target.value)}
              maxChars={200}
              currentLength={descripcionBreve.length}
              required
            />

            <Textarea
              label="Descripcion completa (opcional)"
              value={descripcionCompleta}
              onChange={(e) => setDescripcionCompleta(e.target.value)}
              maxChars={5000}
              currentLength={descripcionCompleta.length}
            />
          </div>
        )}

        {/* Step 2: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text-1">Modalidad</legend>
              <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
                {(['presencial', 'virtual'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModalidad(m)}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      modalidad === m ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </fieldset>

            {modalidad === 'presencial' && (
              <Input label="Zona" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Ej: Centro, Norte..." required />
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text-1">Tipo de capacidad</legend>
              <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
                {(['individual', 'grupal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoCapacidad(t)}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      tipoCapacidad === t ? 'bg-surface text-text-1 shadow-sm' : 'text-text-3 hover:text-text-2'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </fieldset>

            {tipoCapacidad === 'grupal' && (
              <Input
                label="Capacidad maxima"
                type="number"
                min={2}
                value={capacidadMaxima}
                onChange={(e) => setCapacidadMaxima(e.target.value)}
              />
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text-1">Disponibilidad</legend>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'mananas', label: 'Mananas' },
                  { key: 'tardes', label: 'Tardes' },
                  { key: 'fines_semana', label: 'Fines de semana' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDisponibilidad(key)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                      disponibilidad.includes(key)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-surface text-text-2 hover:bg-surface-2'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* Step 3: Preview & Publish */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-text-2">Asi se vera tu oferta en la pagina de exploracion:</p>
            <div className="mx-auto max-w-xs">
              <OfertaCardComponent oferta={previewCard} categorias={categorias} />
            </div>

            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <h3 className="mb-2 text-sm font-semibold text-text-1">Resumen</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-text-3">Titulo</dt><dd className="text-text-1">{titulo}</dd></div>
                <div className="flex justify-between"><dt className="text-text-3">Categoria</dt><dd className="text-text-1">{categorias?.find((c) => c.id === categoriaId)?.nombre ?? '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-text-3">Modalidad</dt><dd className="text-text-1 capitalize">{modalidad}</dd></div>
                {zona && <div className="flex justify-between"><dt className="text-text-3">Zona</dt><dd className="text-text-1">{zona}</dd></div>}
                <div className="flex justify-between"><dt className="text-text-3">Capacidad</dt><dd className="text-text-1 capitalize">{tipoCapacidad}{tipoCapacidad === 'grupal' && capacidadMaxima ? ` (max ${capacidadMaxima})` : ''}</dd></div>
                {disponibilidad.length > 0 && (
                  <div className="flex justify-between"><dt className="text-text-3">Disponibilidad</dt><dd className="text-text-1">{disponibilidad.join(', ')}</dd></div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Atras
          </Button>

          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
            >
              Siguiente
            </Button>
          ) : (
            <Button type="submit" disabled={crearOferta.isPending}>
              {crearOferta.isPending ? 'Creando...' : 'Publicar oferta'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
