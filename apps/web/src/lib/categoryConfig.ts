import {
  Palette, Code, UtensilsCrossed, Dumbbell, Music, Globe,
  Camera, Scissors, Flower2, Drama,
} from 'lucide-react';
import type { ElementType } from 'react';

interface CatConfig {
  bg: string;       // gradient para card header (usa tokens light/dark)
  icon: ElementType;
  accent: string;   // chip de icono (fondo + texto)
}

/**
 * Configuración por categoría. Usa CSS variables tokenizadas (light/dark) en
 * lugar de paletas hardcodeadas de Tailwind. Cada tinte tiene su versión dark
 * definida en `tokens.css` bajo `.dark` y `prefers-color-scheme: dark`.
 */
const config: Record<string, CatConfig> = {
  arte:          { bg: '[background:linear-gradient(135deg,var(--tint-pink),var(--surface))]',     icon: Palette,         accent: 'bg-[var(--tint-pink)] text-[var(--tint-pink-ink)]' },
  tecnologia:    { bg: '[background:linear-gradient(135deg,var(--tint-blue),var(--surface))]',     icon: Code,            accent: 'bg-[var(--tint-blue)] text-[var(--tint-blue-ink)]' },
  cocina:        { bg: '[background:linear-gradient(135deg,var(--tint-emerald),var(--surface))]',  icon: UtensilsCrossed, accent: 'bg-[var(--tint-emerald)] text-[var(--tint-emerald-ink)]' },
  deportes:      { bg: '[background:linear-gradient(135deg,var(--tint-red),var(--surface))]',      icon: Dumbbell,        accent: 'bg-[var(--tint-red)] text-[var(--tint-red-ink)]' },
  musica:        { bg: '[background:linear-gradient(135deg,var(--tint-purple),var(--surface))]',   icon: Music,           accent: 'bg-[var(--tint-purple)] text-[var(--tint-purple-ink)]' },
  idiomas:       { bg: '[background:linear-gradient(135deg,var(--tint-amber),var(--surface))]',    icon: Globe,           accent: 'bg-[var(--tint-amber)] text-[var(--tint-amber-ink)]' },
  fotografia:    { bg: '[background:linear-gradient(135deg,var(--tint-teal),var(--surface))]',     icon: Camera,          accent: 'bg-[var(--tint-teal)] text-[var(--tint-teal-ink)]' },
  manualidades:  { bg: '[background:linear-gradient(135deg,var(--tint-indigo),var(--surface))]',   icon: Scissors,        accent: 'bg-[var(--tint-indigo)] text-[var(--tint-indigo-ink)]' },
  jardineria:    { bg: '[background:linear-gradient(135deg,var(--tint-lime),var(--surface))]',     icon: Flower2,         accent: 'bg-[var(--tint-lime)] text-[var(--tint-lime-ink-cat)]' },
  danza:         { bg: '[background:linear-gradient(135deg,var(--tint-fuchsia),var(--surface))]',  icon: Drama,           accent: 'bg-[var(--tint-fuchsia)] text-[var(--tint-fuchsia-ink)]' },
};

const fallback: CatConfig = {
  bg: '[background:linear-gradient(135deg,var(--tint-gray),var(--surface))]',
  icon: Palette,
  accent: 'bg-[var(--tint-gray)] text-[var(--tint-gray-ink)]',
};

export function getCategoryConfig(slug?: string | null): CatConfig {
  if (!slug) return fallback;
  return config[slug] ?? fallback;
}

export function getCategoryConfigById(id: number | string, categorias?: { id: number; slug: string }[]): CatConfig {
  if (!categorias) return fallback;
  const cat = categorias.find((c) => c.id === Number(id));
  return getCategoryConfig(cat?.slug);
}
