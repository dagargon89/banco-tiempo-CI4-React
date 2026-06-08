import {
  Palette, Code, UtensilsCrossed, Dumbbell, Music, Globe,
  Camera, Scissors, Flower2, Drama,
} from 'lucide-react';
import type { ElementType } from 'react';

interface CatConfig {
  bg: string;       // card header gradient
  icon: ElementType;
  accent: string;   // icon circle bg
}

const config: Record<string, CatConfig> = {
  arte:          { bg: 'from-pink-100 to-pink-50',     icon: Palette,           accent: 'bg-pink-200 text-pink-600' },
  tecnologia:    { bg: 'from-blue-100 to-blue-50',     icon: Code,              accent: 'bg-blue-200 text-blue-600' },
  cocina:        { bg: 'from-emerald-100 to-emerald-50', icon: UtensilsCrossed, accent: 'bg-emerald-200 text-emerald-600' },
  deportes:      { bg: 'from-red-100 to-red-50',       icon: Dumbbell,          accent: 'bg-red-200 text-red-600' },
  musica:        { bg: 'from-purple-100 to-purple-50', icon: Music,             accent: 'bg-purple-200 text-purple-600' },
  idiomas:       { bg: 'from-amber-100 to-amber-50',   icon: Globe,             accent: 'bg-amber-200 text-amber-600' },
  fotografia:    { bg: 'from-teal-100 to-teal-50',     icon: Camera,            accent: 'bg-teal-200 text-teal-600' },
  manualidades:  { bg: 'from-indigo-100 to-indigo-50', icon: Scissors,          accent: 'bg-indigo-200 text-indigo-600' },
  jardineria:    { bg: 'from-lime-100 to-lime-50',     icon: Flower2,           accent: 'bg-lime-200 text-lime-600' },
  danza:         { bg: 'from-fuchsia-100 to-fuchsia-50', icon: Drama,           accent: 'bg-fuchsia-200 text-fuchsia-600' },
};

const fallback: CatConfig = { bg: 'from-gray-100 to-gray-50', icon: Palette, accent: 'bg-gray-200 text-gray-600' };

export function getCategoryConfig(slug?: string | null): CatConfig {
  if (!slug) return fallback;
  return config[slug] ?? fallback;
}

export function getCategoryConfigById(id: number | string, categorias?: { id: number; slug: string }[]): CatConfig {
  if (!categorias) return fallback;
  const cat = categorias.find((c) => c.id === Number(id));
  return getCategoryConfig(cat?.slug);
}
