import {
  Palette, Code, UtensilsCrossed, Dumbbell, Music, Languages,
  Camera, Scissors, Footprints, Shapes, Sprout,
} from 'lucide-react';
import type { ElementType } from 'react';

interface CatConfig {
  /** Fondo plano de la categoría (sin degradado). */
  bg: string;
  icon: ElementType;
  /** Chip de ícono: fondo y tinta de la categoría. */
  accent: string;
  /** Solo la tinta, para íconos o texto sobre superficie neutra. */
  ink: string;
}

/**
 * Cada categoría usa su par --cat-x / --cat-x-ink de `tokens.css`: una familia
 * de tonos profundos y apagados, armonizada con el morado de la marca y con
 * versión para modo oscuro. Contraste de la tinta sobre su fondo ≥ 6:1.
 */
function cat(slug: string, icon: ElementType): CatConfig {
  return {
    bg: `bg-[var(--cat-${slug})]`,
    icon,
    accent: `bg-[var(--cat-${slug})] text-[var(--cat-${slug}-ink)]`,
    ink: `text-[var(--cat-${slug}-ink)]`,
  };
}

// Las clases se escriben completas arriba vía plantilla; Tailwind las detecta
// porque los valores literales aparecen aquí:
// bg-[var(--cat-arte)] text-[var(--cat-arte-ink)] bg-[var(--cat-tecnologia)] text-[var(--cat-tecnologia-ink)]
// bg-[var(--cat-cocina)] text-[var(--cat-cocina-ink)] bg-[var(--cat-deportes)] text-[var(--cat-deportes-ink)]
// bg-[var(--cat-musica)] text-[var(--cat-musica-ink)] bg-[var(--cat-idiomas)] text-[var(--cat-idiomas-ink)]
// bg-[var(--cat-fotografia)] text-[var(--cat-fotografia-ink)] bg-[var(--cat-manualidades)] text-[var(--cat-manualidades-ink)]
// bg-[var(--cat-danza)] text-[var(--cat-danza-ink)] bg-[var(--cat-otras)] text-[var(--cat-otras-ink)]

const config: Record<string, CatConfig> = {
  arte:         cat('arte', Palette),
  tecnologia:   cat('tecnologia', Code),
  cocina:       cat('cocina', UtensilsCrossed),
  deportes:     cat('deportes', Dumbbell),
  musica:       cat('musica', Music),
  idiomas:      cat('idiomas', Languages),
  fotografia:   cat('fotografia', Camera),
  manualidades: cat('manualidades', Scissors),
  danza:        cat('danza', Footprints),
  jardineria:   cat('cocina', Sprout),
  otras:        cat('otras', Shapes),
};

const fallback: CatConfig = cat('otras', Shapes);

export function getCategoryConfig(slug?: string | null): CatConfig {
  if (!slug) return fallback;
  return config[slug] ?? fallback;
}

export function getCategoryConfigById(id: number | string, categorias?: { id: number; slug: string }[]): CatConfig {
  if (!categorias) return fallback;
  const c = categorias.find((x) => Number(x.id) === Number(id));
  return getCategoryConfig(c?.slug);
}
