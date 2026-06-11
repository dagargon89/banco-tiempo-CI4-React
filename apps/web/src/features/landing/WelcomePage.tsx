import { Link, Navigate } from 'react-router-dom';
import {
  Sparkles, Search, MessageCircle, Award, Heart, MapPin, Star,
  Palette, Scissors, Music, Activity, Languages, Cpu, ChefHat,
  Sparkle as Drama, Camera, LayoutGrid,
} from 'lucide-react';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useAuthStore } from '@/stores/authStore';
import { getCategoryConfig } from '@/lib/categoryConfig';
import type { Categoria } from '@/lib/types';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Cards demo del hero (estáticas, sirven para mostrar de qué va el sistema)
const demoCards = [
  {
    categoria: 'Cocina',
    catSlug: 'cocina',
    modalidad: 'Presencial',
    titulo: 'Repostería tradicional mexicana',
    nombre: 'Guadalupe Mendoza',
  },
  {
    categoria: 'Tecnología',
    catSlug: 'tecnologia',
    modalidad: 'Virtual',
    titulo: 'Introducción a la programación con Python',
    nombre: 'José Luis',
  },
  {
    categoria: 'Idiomas',
    catSlug: 'idiomas',
    modalidad: 'Virtual',
    titulo: 'Inglés conversacional intermedio',
    nombre: 'Andrés Felipe',
  },
] as const;

const pasos = [
  {
    icon: Search,
    titulo: 'Descubre',
    desc: 'Explora habilidades que tu comunidad ofrece: arte, cocina, idiomas, tecnología y más. Filtra por zona y modalidad.',
  },
  {
    icon: MessageCircle,
    titulo: 'Conecta',
    desc: 'Marca «Me interesa» y, al ser aceptado, se abre un chat directo con quien enseña. Sin costo, sin intermediarios.',
  },
  {
    icon: Award,
    titulo: 'Aprende y reseña',
    desc: 'Vive la actividad, gana insignias y deja una reseña mutua que fortalece la confianza de toda la red.',
  },
] as const;

// Iconos fallback por slug si la categoría no tiene config (orden de la imagen demo)
const fallbackCatIcons: Record<string, typeof Palette> = {
  arte: Palette,
  manualidades: Scissors,
  musica: Music,
  deportes: Activity,
  idiomas: Languages,
  tecnologia: Cpu,
  cocina: ChefHat,
  danza: Drama,
  fotografia: Camera,
};

function CategoryTile({ cat }: { cat: Categoria }) {
  const cfg = getCategoryConfig(cat.slug);
  const Icon = fallbackCatIcons[cat.slug] ?? cfg.icon;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-1">{cat.nombre}</p>
        <p className="text-xs text-text-3">Categoría</p>
      </div>
    </div>
  );
}

function FakeAvatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white ring-2 ring-surface">
      {initials}
    </div>
  );
}

function DemoOfertaCard({ card }: { card: typeof demoCards[number] }) {
  const cfg = getCategoryConfig(card.catSlug);
  const Icon = fallbackCatIcons[card.catSlug] ?? cfg.icon;
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className={`flex items-center justify-center ${cfg.bg} py-6`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cfg.accent}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center rounded-pill border border-border px-2 py-0.5 text-[10px] font-medium ${cfg.accent}`}>
            {card.categoria}
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill border border-info/20 bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
            <MapPin className="h-2.5 w-2.5" />
            {card.modalidad}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-text-1">{card.titulo}</h3>
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <FakeAvatar name={card.nombre} />
          <span className="text-xs text-text-2">{card.nombre}</span>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { user, initialized, loading } = useAuthStore();
  const { data: categorias, isLoading: catsLoading } = useCategorias();

  // Si ya está autenticado, mandarlo al home autenticado
  if (!loading && initialized && user) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-bold text-white">BT</span>
            </div>
            <span className="font-display text-base font-bold text-text-1">
              Banco de Tiempo
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle hideSystem />
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover sm:px-4"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left side */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-lime-soft px-3 py-1 text-xs font-semibold text-lime-ink dark:text-lime">
              <Sparkles className="h-3.5 w-3.5" />
              Plan Juárez · Voluntariado de habilidades
            </div>

            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-text-1 sm:text-5xl lg:text-6xl">
              Intercambia lo que sabes,
              <br />
              <span className="text-accent">aprende</span> lo que quieres
            </h1>

            <p className="mt-5 text-base text-text-2 sm:text-lg">
              <strong className="text-text-1">Banco de Tiempo</strong> conecta a
              quienes enseñan con quienes quieren aprender en Ciudad Juárez. La
              única moneda es el tiempo compartido.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/registro"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover"
              >
                <Search className="h-4 w-4" />
                Quiero aprender algo
              </Link>
              <Link
                to="/registro"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-1 transition-colors hover:bg-surface-2"
              >
                <span className="text-lg leading-none">+</span>
                Quiero enseñar algo
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 sm:max-w-md">
              <div>
                <p className="font-display text-2xl font-bold text-text-1 sm:text-3xl">1,284</p>
                <p className="text-xs text-text-3">vecinos activos</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-text-1 sm:text-3xl">312</p>
                <p className="text-xs text-text-3">habilidades</p>
              </div>
              <div>
                <p className="flex items-baseline gap-1 font-display text-2xl font-bold text-text-1 sm:text-3xl">
                  4.7
                  <Star className="h-4 w-4 fill-warning text-warning" />
                </p>
                <p className="text-xs text-text-3">calificación</p>
              </div>
            </div>
          </div>

          {/* Right side — 4 cards grid */}
          <div className="grid grid-cols-2 gap-4">
            <DemoOfertaCard card={demoCards[0]} />
            <DemoOfertaCard card={demoCards[1]} />
            <DemoOfertaCard card={demoCards[2]} />

            {/* Stat card with brand color */}
            <div
              className="flex flex-col justify-between rounded-xl p-5 text-white shadow-sm"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <Heart className="h-7 w-7" />
              <div>
                <p className="text-2xl font-bold leading-tight">+1,800</p>
                <p className="mt-1 text-sm font-semibold">vinculaciones logradas</p>
                <p className="mt-2 text-xs opacity-90">
                  entre vecinos de todas las colonias de Juárez.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="mt-20 sm:mt-28">
          <h2 className="font-display text-2xl font-bold text-text-1 sm:text-3xl">
            Explora por categoría
          </h2>
          <p className="mt-1 text-sm text-text-2 sm:text-base">
            Áreas de conocimiento que vecinos comparten cada semana.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {catsLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface-2" />
              ))
            ) : (
              <>
                {categorias?.filter((c) => c.activa).map((cat) => (
                  <CategoryTile key={cat.id} cat={cat} />
                ))}
                {/* Tile genérica para "Otras" */}
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-text-3">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-1">Y muchas más</p>
                    <p className="text-xs text-text-3">Regístrate para ver todas</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mt-20 sm:mt-28">
          <div className="text-center">
            <p className="font-semibold uppercase tracking-wider text-accent text-xs">
              Cómo funciona
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-text-1 sm:text-3xl lg:text-4xl">
              Tres pasos para empezar a intercambiar
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pasos.map((paso, i) => {
              const Icon = paso.icon;
              return (
                <div
                  key={paso.titulo}
                  className="relative rounded-xl border border-border bg-surface p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-display text-3xl font-bold text-border-strong">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-text-1">{paso.titulo}</h3>
                  <p className="mt-2 text-sm text-text-2">{paso.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-20 rounded-2xl p-8 text-center sm:mt-28 sm:p-12" style={{ background: 'var(--brand-gradient)' }}>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            ¿Listo para empezar a intercambiar?
          </h2>
          <p className="mt-3 text-sm text-white/85 sm:text-base">
            Únete a la red de vecinos que comparten su tiempo en Ciudad Juárez.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/registro"
              className="inline-flex items-center gap-2 rounded-lg bg-lime px-5 py-3 text-sm font-bold text-lime-ink transition-opacity hover:opacity-90"
            >
              Crear cuenta gratis
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-text-3 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Plan Juárez · Banco de Tiempo</p>
          <Link to="/privacidad" className="hover:text-accent">
            Aviso de privacidad
          </Link>
        </div>
      </footer>
    </div>
  );
}
