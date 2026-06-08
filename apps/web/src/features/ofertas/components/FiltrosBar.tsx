import { Search } from 'lucide-react';
import { useCategorias } from '../hooks/useCategorias';

interface FiltrosBarProps {
  categoriaId: number | null;
  modalidad: string | null;
  zona: string;
  q: string;
  onChange: (filtros: { categoriaId?: number | null; modalidad?: string | null; zona?: string; q?: string }) => void;
}

const selectBase = 'h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-1 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15';

export default function FiltrosBar({ categoriaId, modalidad, zona, q, onChange }: FiltrosBarProps) {
  const { data: categorias } = useCategorias();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
        <input
          type="text"
          placeholder="Buscar por habilidades, palabra clave..."
          value={q}
          onChange={(e) => onChange({ q: e.target.value })}
          className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
      </div>

      {/* Category dropdown */}
      <select
        value={categoriaId ?? ''}
        onChange={(e) => onChange({ categoriaId: e.target.value ? Number(e.target.value) : null })}
        className={selectBase}
      >
        <option value="">Todas las categorias</option>
        {categorias?.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
      </select>

      {/* Modality dropdown */}
      <select
        value={modalidad ?? ''}
        onChange={(e) => onChange({ modalidad: e.target.value || null })}
        className={selectBase}
      >
        <option value="">Todas las modalidades</option>
        <option value="presencial">Presencial</option>
        <option value="virtual">Virtual</option>
      </select>

      {/* Zone dropdown / input */}
      <input
        type="text"
        placeholder="Todas las zonas"
        value={zona}
        onChange={(e) => onChange({ zona: e.target.value })}
        className={`${selectBase} w-40`}
      />
    </div>
  );
}
