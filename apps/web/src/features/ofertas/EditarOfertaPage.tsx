import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useCategorias } from './hooks/useCategorias';
import { useOfertaDetalle, useActualizarOferta } from './hooks/useOfertas';
import type { Modalidad, TipoCapacidad } from '@/lib/types';

export default function EditarOfertaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: oferta, isLoading } = useOfertaDetalle(id!);
  const { data: categorias } = useCategorias();
  const actualizar = useActualizarOferta();

  const [titulo, setTitulo] = useState('');
  const [categoriaId, setCategoriaId] = useState<number>(0);
  const [descripcionBreve, setDescripcionBreve] = useState('');
  const [descripcionCompleta, setDescripcionCompleta] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [zona, setZona] = useState('');
  const [tipoCapacidad, setTipoCapacidad] = useState<TipoCapacidad>('individual');
  const [capacidadMaxima, setCapacidadMaxima] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (oferta && !loaded) {
      setTitulo(oferta.titulo);
      setCategoriaId(oferta.categoria_id);
      setDescripcionBreve(oferta.descripcion_breve);
      setDescripcionCompleta(oferta.descripcion_completa ?? '');
      setModalidad(oferta.modalidad);
      setZona(oferta.zona ?? '');
      setTipoCapacidad(oferta.tipo_capacidad ?? 'individual');
      setCapacidadMaxima(oferta.capacidad_maxima ? String(oferta.capacidad_maxima) : '');
      try {
        const disp = typeof oferta.disponibilidad === 'string' ? JSON.parse(oferta.disponibilidad) : oferta.disponibilidad;
        setDisponibilidad(Array.isArray(disp) ? disp : []);
      } catch {
        setDisponibilidad([]);
      }
      setLoaded(true);
    }
  }, [oferta, loaded]);

  const toggleDisponibilidad = (val: string) => {
    setDisponibilidad((prev) => prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    actualizar.mutate(
      {
        id: Number(id),
        datos: {
          titulo,
          categoria_id: categoriaId,
          descripcion_breve: descripcionBreve,
          descripcion_completa: descripcionCompleta || undefined,
          modalidad,
          zona: modalidad === 'presencial' ? zona : undefined,
          tipo_capacidad: tipoCapacidad,
          capacidad_maxima: tipoCapacidad === 'grupal' && capacidadMaxima ? Number(capacidadMaxima) : undefined,
          disponibilidad: disponibilidad.length > 0 ? disponibilidad : undefined,
        },
      },
      {
        onSuccess: (data) => navigate(`/ofertas/${data.id}`),
        onError: (err: any) => {
          const msg = err?.response?.data?.errors?.validation ?? err?.response?.data?.message ?? 'Error al actualizar.';
          setError(msg);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 font-display text-xl font-bold text-text-1">Editar oferta</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={140} required />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-1">Categoria</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(Number(e.target.value))}
              className="h-10 rounded-sm border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
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

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text-1">Modalidad</legend>
            <div className="flex gap-4">
              {(['presencial', 'virtual'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm text-text-2">
                  <input type="radio" name="modalidad" value={m} checked={modalidad === m} onChange={() => setModalidad(m)} />
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>

          {modalidad === 'presencial' && (
            <Input label="Zona" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Ej: Centro, Norte..." required />
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text-1">Tipo de capacidad</legend>
            <div className="flex gap-4">
              {(['individual', 'grupal'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-text-2">
                  <input type="radio" name="tipo_capacidad" value={t} checked={tipoCapacidad === t} onChange={() => setTipoCapacidad(t)} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
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
            <div className="flex flex-wrap gap-3">
              {['mananas', 'tardes', 'fines_semana'].map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm text-text-2">
                  <input type="checkbox" checked={disponibilidad.includes(d)} onChange={() => toggleDisponibilidad(d)} />
                  {d === 'mananas' ? 'Mananas' : d === 'tardes' ? 'Tardes' : 'Fines de semana'}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" fullWidth disabled={actualizar.isPending}>
            {actualizar.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </main>
    </div>
  );
}
