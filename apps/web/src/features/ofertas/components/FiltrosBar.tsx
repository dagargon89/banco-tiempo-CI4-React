import { useCategorias } from '../hooks/useCategorias';
import Input from '@/components/ui/Input';

interface FiltrosBarProps {
  categoriaId: number | null;
  modalidad: string | null;
  zona: string;
  q: string;
  onChange: (filtros: { categoriaId?: number | null; modalidad?: string | null; zona?: string; q?: string }) => void;
}

export default function FiltrosBar({ categoriaId, modalidad, zona, q, onChange }: FiltrosBarProps) {
  const { data: categorias } = useCategorias();

  return (
    <div className="space-y-3">
      {/* Categorías como pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange({ categoriaId: null })}
          className={`rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
            categoriaId === null ? 'bg-accent text-white' : 'bg-surface-2 text-text-2 hover:bg-surface-2/80'
          }`}
        >
          Todas
        </button>
        {categorias?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange({ categoriaId: cat.id === categoriaId ? null : cat.id })}
            className={`rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              categoriaId === cat.id ? 'bg-accent text-white' : 'bg-surface-2 text-text-2 hover:bg-surface-2/80'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Filtros secundarios */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          {(['presencial', 'virtual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChange({ modalidad: modalidad === m ? null : m })}
              className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                modalidad === m ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-text-2 hover:bg-surface-2'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="w-40">
          <Input
            placeholder="Zona..."
            value={zona}
            onChange={(e) => onChange({ zona: e.target.value })}
          />
        </div>

        <div className="w-52">
          <Input
            placeholder="Buscar..."
            value={q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
