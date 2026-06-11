import { useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Sparkles, Search, MessageCircle, Award, MapPin, Star, Clock, Heart, Check,
  Palette, Scissors, Music, Activity, Languages, Cpu, ChefHat,
  Sparkle as Drama, Camera,
} from 'lucide-react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useAuthStore } from '@/stores/authStore';
import { getCategoryConfig } from '@/lib/categoryConfig';
import type { Categoria } from '@/lib/types';
import ThemeToggle from '@/components/ui/ThemeToggle';

gsap.registerPlugin(SplitText, ScrollTrigger, Flip);

// Mapeo de imágenes por slug (cámbialas si quieres otras).
// Usa picsum.photos para que sean estables y consistentes sin claves.
const CATEGORY_IMAGES: Record<string, string> = {
  arte: 'https://picsum.photos/seed/arte/720/960',
  manualidades: 'https://picsum.photos/seed/manualidades/720/960',
  musica: 'https://picsum.photos/seed/musica/720/960',
  deportes: 'https://picsum.photos/seed/deportes/720/960',
  idiomas: 'https://picsum.photos/seed/idiomas/720/960',
  tecnologia: 'https://picsum.photos/seed/tecnologia/720/960',
  cocina: 'https://picsum.photos/seed/cocina/720/960',
  danza: 'https://picsum.photos/seed/danza/720/960',
  fotografia: 'https://picsum.photos/seed/fotografia/720/960',
  otras: 'https://picsum.photos/seed/otras/720/960',
};

function imageForCategory(slug: string) {
  return CATEGORY_IMAGES[slug] ?? `https://picsum.photos/seed/${slug}/720/960`;
}

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
    desc: 'Explora habilidades que tu comunidad ofrece: arte, cocina, idiomas, tecnología y más.',
    bullets: ['Búsqueda por categoría', 'Filtro por zona', 'Presencial o virtual'],
    image: 'https://picsum.photos/seed/paso-descubre/640/360',
    tiempo: '5 min',
  },
  {
    icon: MessageCircle,
    titulo: 'Conecta',
    desc: 'Marca «Me interesa» y, al ser aceptado, se abre un chat directo con quien enseña.',
    bullets: ['Chat seguro 1 a 1', 'Sin pago, sin app extra', 'Notificaciones por correo'],
    image: 'https://picsum.photos/seed/paso-conecta/640/360',
    tiempo: '1 día',
  },
  {
    icon: Award,
    titulo: 'Aprende y reseña',
    desc: 'Vive la actividad, gana insignias y deja una reseña mutua que fortalece la red.',
    bullets: ['Insignias por participar', 'Reseña recíproca', 'Tu reputación crece'],
    image: 'https://picsum.photos/seed/paso-resena/640/360',
    tiempo: '60–90 min',
  },
] as const;

// Polaroids decorativas: fotos muestra rotadas en los huecos del zigzag
const polaroids = [
  {
    src: 'https://picsum.photos/seed/polaroid-vecinos/280/320',
    alt: 'Vecinos compartiendo',
    pos: 'md:top-[18%] md:left-[44%]',
    rot: '-rotate-6',
  },
  {
    src: 'https://picsum.photos/seed/polaroid-taller/280/320',
    alt: 'Taller comunitario',
    pos: 'md:top-[60%] md:right-[38%]',
    rot: 'rotate-[5deg]',
  },
  {
    src: 'https://picsum.photos/seed/polaroid-cafe/280/320',
    alt: 'Café en barrio',
    pos: 'md:top-[78%] md:left-[36%]',
    rot: '-rotate-3',
  },
];

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

function CategoryCard({ cat }: { cat: Categoria }) {
  const cfg = getCategoryConfig(cat.slug);
  const Icon = fallbackCatIcons[cat.slug] ?? cfg.icon;
  return (
    <article className="cat-card flex w-[78vw] max-w-[22rem] flex-shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-md sm:w-[20rem] md:w-[22rem]">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
        <img
          src={imageForCategory(cat.slug)}
          alt={cat.nombre}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-center gap-3 p-5">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${cfg.accent}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-text-1">{cat.nombre}</p>
          <p className="text-xs text-text-3">Categoría</p>
        </div>
      </div>
    </article>
  );
}

function HorizontalCategories({ categorias }: { categorias: Categoria[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const strip = stripRef.current;
    if (!wrapper || !strip) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const getLength = () => Math.max(0, strip.scrollWidth - wrapper.clientWidth);

      gsap.to(strip, {
        x: () => `-${getLength()}px`,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapper,
          pin: true,
          scrub: 0.5,
          start: 'center center',
          end: () => `+=${getLength()}`,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => mm.revert();
  }, [categorias.length]);

  return (
    <div
      ref={wrapperRef}
      className="cat-gallery-wrapper relative -mx-4 overflow-x-auto md:mx-0 md:h-[80vh] md:overflow-hidden"
    >
      <div
        ref={stripRef}
        className="cat-gallery-strip flex flex-nowrap items-center gap-6 px-4 pb-2 md:h-full md:pb-0 md:[will-change:transform]"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {categorias.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
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

  const cardRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardEl = cardRef.current;
    const outerEl = outerRef.current;
    const innerEl = innerRef.current;
    if (!cardEl || !outerEl || !innerEl) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const outerRX = gsap.quickTo(outerEl, 'rotationX', { ease: 'power3', duration: 0.5 });
    const outerRY = gsap.quickTo(outerEl, 'rotationY', { ease: 'power3', duration: 0.5 });
    const innerX = gsap.quickTo(innerEl, 'x', { ease: 'power3', duration: 0.5 });
    const innerY = gsap.quickTo(innerEl, 'y', { ease: 'power3', duration: 0.5 });

    const handleMove = (e: PointerEvent) => {
      const rect = cardEl.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      outerRX(gsap.utils.interpolate(15, -15, py));
      outerRY(gsap.utils.interpolate(-15, 15, px));
      innerX(gsap.utils.interpolate(-30, 30, px));
      innerY(gsap.utils.interpolate(-30, 30, py));
    };

    const handleLeave = () => {
      outerRX(0);
      outerRY(0);
      innerX(0);
      innerY(0);
    };

    cardEl.addEventListener('pointermove', handleMove);
    cardEl.addEventListener('pointerleave', handleLeave);

    return () => {
      cardEl.removeEventListener('pointermove', handleMove);
      cardEl.removeEventListener('pointerleave', handleLeave);
      gsap.killTweensOf([outerEl, innerEl]);
    };
  }, []);

  return (
    <div ref={cardRef} style={{ perspective: '650px' }}>
      <div
        ref={outerRef}
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <div ref={innerRef} style={{ willChange: 'transform' }}>
          <div className={`flex items-center justify-center ${cfg.bg} py-14`}>
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${cfg.accent}`}>
              <Icon className="h-7 w-7" />
            </div>
          </div>
          <div className="flex flex-col gap-2 p-4">
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
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <FakeAvatar name={card.nombre} />
              <span className="text-xs text-text-2">{card.nombre}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { user, initialized, loading } = useAuthStore();
  const { data: categorias, isLoading: catsLoading } = useCategorias();

  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const pasoCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const travelerRef = useRef<HTMLDivElement>(null);

  // Flip + ScrollTrigger: viajero por las tarjetas de "Cómo funciona"
  useEffect(() => {
    const traveler = travelerRef.current;
    if (!traveler) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const cards = pasoCardsRef.current.filter(Boolean) as HTMLDivElement[];
      if (cards.length < 2) return;

      let tl: gsap.core.Timeline | null = null;

      const build = () => {
        if (tl) {
          tl.scrollTrigger?.kill();
          tl.kill();
        }

        Flip.fit(traveler, cards[0]);
        gsap.set(traveler, { opacity: 1 });

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: cards[0],
            endTrigger: cards[cards.length - 1],
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        cards.slice(1).forEach((card, idx) => {
          const tw = Flip.fit(traveler, card, { duration: 1, ease: 'none' });
          if (tw) tl!.add(tw as gsap.core.Tween, idx === 0 ? 0 : '+=0.5');
        });

        ScrollTrigger.refresh();
      };

      build();

      // Reconstruir cuando las imágenes terminen de cargar (los cards crecen)
      const images = cards.flatMap((c) => Array.from(c.querySelectorAll('img')));
      const pending = images.filter((img) => !img.complete);
      if (pending.length > 0) {
        let remaining = pending.length;
        const onDone = () => {
          remaining--;
          if (remaining === 0) build();
        };
        pending.forEach((img) => {
          img.addEventListener('load', onDone, { once: true });
          img.addEventListener('error', onDone, { once: true });
        });
      }
    });

    return () => mm.revert();
  }, []);

  useEffect(() => {
    const h1 = heroTitleRef.current;
    if (!h1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      h1.style.opacity = '1';
      return;
    }

    let split: SplitText | null = null;
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled || !heroTitleRef.current) return;
      heroTitleRef.current.style.opacity = '1';
      split = SplitText.create(heroTitleRef.current, { type: 'words', wordsClass: 'word' });
      gsap.from(split.words, {
        y: -100,
        opacity: 0,
        rotation: 'random(-80, 80)',
        stagger: 0.1,
        duration: 1,
        ease: 'back',
      });
    });

    return () => {
      cancelled = true;
      if (split) split.revert();
    };
  }, []);

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

            <h1
              ref={heroTitleRef}
              className="mt-5 font-display text-4xl font-bold leading-tight text-text-1 sm:text-5xl lg:text-6xl"
              style={{ opacity: 0 }}
            >
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

          {/* Right side — stacked cards */}
          <div className="relative mx-auto h-[560px] w-full max-w-md sm:h-[620px] lg:h-[640px] lg:max-w-none">
            {/* Arriba — Cocina */}
            <div className="absolute right-0 top-0 w-[58%] rotate-[2deg] drop-shadow-xl">
              <DemoOfertaCard card={demoCards[0]} />
            </div>
            {/* Centro al frente — Tecnología */}
            <div className="absolute left-0 top-[22%] z-10 w-[58%] -rotate-[3deg] drop-shadow-xl">
              <DemoOfertaCard card={demoCards[1]} />
            </div>
            {/* Abajo — Idiomas */}
            <div className="absolute bottom-0 right-0 w-[58%] rotate-[3deg] drop-shadow-xl">
              <DemoOfertaCard card={demoCards[2]} />
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

          <div className="mt-8">
            {catsLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] w-[78vw] max-w-[22rem] flex-shrink-0 animate-pulse rounded-2xl border border-border bg-surface-2 sm:w-[20rem] md:w-[22rem]"
                  />
                ))}
              </div>
            ) : (
              <HorizontalCategories
                categorias={(categorias ?? []).filter((c) => c.activa)}
              />
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

          <div className="relative mt-10 flex flex-col gap-4 md:block md:h-[180vh] md:gap-0">
            {/* Polaroids decorativas — solo md+ */}
            {polaroids.map((p, idx) => (
              <div
                key={idx}
                aria-hidden
                className={`pointer-events-none absolute hidden md:block ${p.pos} ${p.rot}`}
              >
                <div className="rounded-md bg-surface p-2 shadow-lg ring-1 ring-border">
                  <div className="h-44 w-40 overflow-hidden rounded-sm bg-surface-2">
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-2 px-1 pb-1 text-center font-display text-xs italic text-text-3">
                    {p.alt}
                  </p>
                </div>
              </div>
            ))}

            {/* Chips flotantes con micro-datos — solo md+ */}
            <div
              aria-hidden
              className="pointer-events-none absolute hidden items-center gap-2 rounded-pill border border-border bg-surface/90 px-3 py-1.5 text-xs font-semibold text-text-2 shadow-md backdrop-blur md:left-[44%] md:top-[8%] md:flex"
            >
              <Clock className="h-3.5 w-3.5 text-accent" />
              60 min promedio
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute hidden items-center gap-2 rounded-pill border border-border bg-surface/90 px-3 py-1.5 text-xs font-semibold text-text-2 shadow-md backdrop-blur md:right-[34%] md:top-[36%] md:flex"
            >
              <Heart className="h-3.5 w-3.5 text-error" />
              Sin pago, solo tiempo
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute hidden items-center gap-2 rounded-pill border border-border bg-surface/90 px-3 py-1.5 text-xs font-semibold text-text-2 shadow-md backdrop-blur md:left-[42%] md:top-[58%] md:flex"
            >
              <MapPin className="h-3.5 w-3.5 text-info" />
              Hecho en Juárez
            </div>

            {/* Cards de pasos */}
            {pasos.map((paso, i) => {
              const Icon = paso.icon;
              const positions = [
                'md:absolute md:top-[2%] md:right-[6%]',
                'md:absolute md:top-[38%] md:left-[6%]',
                'md:absolute md:bottom-[3%] md:right-[10%]',
              ];
              return (
                <div
                  key={paso.titulo}
                  ref={(el) => {
                    pasoCardsRef.current[i] = el;
                  }}
                  className={`relative z-10 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-md md:w-[380px] ${positions[i]}`}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                    <img
                      src={paso.image}
                      alt={paso.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-text-1 shadow-sm backdrop-blur">
                      <Clock className="h-3 w-3 text-accent" />
                      {paso.tiempo}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-display text-3xl font-bold text-border-strong">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-text-1">{paso.titulo}</h3>
                    <p className="mt-1.5 text-sm text-text-2">{paso.desc}</p>

                    <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
                      {paso.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs text-text-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            {/* Traveler (Flip target) */}
            <div
              ref={travelerRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-20 rounded-2xl opacity-0"
              style={{
                outline: '3px solid var(--accent)',
                outlineOffset: '4px',
                boxShadow: '0 16px 40px -8px rgba(83,21,90,.45)',
              }}
            />
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
