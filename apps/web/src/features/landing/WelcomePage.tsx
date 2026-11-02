import { useDeferredValue, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useExplorarOfertas } from '@/features/ofertas/hooks/useOfertas';
import OfertaCardComponent from '@/features/ofertas/components/OfertaCardComponent';
import { OfertaCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { getCategoryConfig } from '@/lib/categoryConfig';
import ThemeToggle from '@/components/ui/ThemeToggle';
import ParticleField from './components/ParticleField';
import GlowCard from './components/GlowCard';
import { ChatIlustracion, IgualdadIlustracion } from './components/Ilustraciones';

const pill =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const pillOscura = `${pill} bg-text-1 text-bg hover:opacity-90`;
const pillClara = `${pill} border border-border bg-surface text-text-1 hover:border-border-strong`;

// En el panel nocturno los colores del tema no contrastan: van fijos.
const PALETA_NOCHE = ['#E7C9EB', '#C9A2CF', '#F1DCF3', '#DBEC57'];

function Seccion({
  titulo,
  texto,
  accion,
  children,
  invertir = false,
}: {
  titulo: string;
  texto: string;
  accion?: ReactNode;
  children: ReactNode;
  invertir?: boolean;
}) {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:py-24">
      <div className={invertir ? 'md:order-2' : ''}>
        <h2 className="font-display text-3xl font-medium leading-tight text-text-1 sm:text-[40px]">{titulo}</h2>
        <p className="mt-4 max-w-md text-text-2">{texto}</p>
        {accion && <div className="mt-6">{accion}</div>}
      </div>
      <div className={invertir ? 'md:order-1' : ''}>{children}</div>
    </section>
  );
}

export default function WelcomePage() {
  const { user, initialized, loading } = useAuthStore();
  const { data: categorias } = useCategorias();
  const categoriasActivas = (categorias ?? []).filter((c) => c.activa);

  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const q = useDeferredValue(texto.trim());
  const filaRef = useRef<HTMLDivElement>(null);

  const { data: resultados, isLoading } = useExplorarOfertas({
    q: q || undefined,
    categoria_id: categoriaId ?? undefined,
    per_page: 12,
  });
  const ofertas = resultados?.data ?? [];
  const total = resultados?.meta.total ?? 0;
  const filtrando = Boolean(q) || categoriaId !== null;
  const categoriaActiva = categoriasActivas.find((c) => Number(c.id) === categoriaId);

  // Muestra para la primera sección: las dos ofertas más recientes sin filtro.
  const { data: recientes } = useExplorarOfertas({ per_page: 2 });
  const muestra = recientes?.data ?? [];

  if (!loading && initialized && user) {
    return <Navigate to="/inicio" replace />;
  }

  const irAOfertas = (e?: FormEvent) => {
    e?.preventDefault();
    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const desplazar = (dir: 1 | -1) => {
    const fila = filaRef.current;
    if (fila) fila.scrollBy({ left: dir * fila.clientWidth * 0.8, behavior: 'smooth' });
  };

  const limpiar = () => {
    setTexto('');
    setCategoriaId(null);
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/logo.png" alt="Participa Juárez" className="brand-logo h-8 w-auto shrink-0" />
            <span className="truncate font-display text-[15px] font-semibold text-text-1">Banco de Tiempo</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-text-2 md:flex" aria-label="Secciones">
            <a href="#como-funciona" className="hover:text-text-1">Cómo funciona</a>
            <a href="#ofertas" className="hover:text-text-1">Ofertas</a>
            <a href="#ensenar" className="hover:text-text-1">Enseñar</a>
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle hideSystem />
            </div>
            <Link to="/login" className="rounded-full px-3 py-2 text-sm text-text-2 hover:text-text-1">
              Iniciar sesión
            </Link>
            <span className="hidden sm:inline-flex">
              <Link to="/registro" className={`${pillOscura} px-4 py-2 text-sm`}>
                Crear cuenta
              </Link>
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* Hero: partículas detrás, titular grande y la búsqueda como primera acción */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <ParticleField />
          </div>
          <div className="mx-auto flex min-h-[calc(100svh-57px)] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
            <p className="flex items-center gap-2 text-sm text-text-2">
              <img src="/favicon.png" alt="" className="h-5 w-5 rounded" />
              Banco de Tiempo de Plan Juárez
            </p>
            <h1 className="mt-6 font-display text-[44px] font-medium leading-[1.02] tracking-[-0.025em] text-text-1 sm:text-7xl lg:text-[88px]">
              Enseña una hora,
              <br />
              aprende una hora.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-text-2">
              Comparte lo que sabes con tus vecinos de Ciudad Juárez y aprende lo que te hace falta. Aquí la única
              moneda es el tiempo.
            </p>

            <form onSubmit={irAOfertas} role="search" className="mt-10 w-full max-w-xl">
              <label htmlFor="buscar" className="sr-only">¿Qué quieres aprender?</label>
              <div className="flex items-center gap-2 rounded-full border border-border-strong bg-surface/90 p-1.5 pl-5 shadow-lg backdrop-blur focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
                <Search className="h-5 w-5 shrink-0 text-text-3" aria-hidden />
                <input
                  id="buscar"
                  type="search"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="¿Qué quieres aprender?"
                  className="h-11 min-w-0 flex-1 bg-transparent text-base text-text-1 placeholder:text-text-2 focus:outline-none"
                />
                <button type="submit" className={`${pillOscura} h-11 px-6 text-sm`}>
                  Buscar
                </button>
              </div>
            </form>

            {categoriasActivas.length > 0 && (
              <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Filtrar por categoría">
                {categoriasActivas.map((cat) => {
                  const cfg = getCategoryConfig(cat.slug);
                  const Icon = cfg.icon;
                  const activa = categoriaId === Number(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => {
                        setCategoriaId(activa ? null : Number(cat.id));
                        if (!activa) irAOfertas();
                      }}
                      className={`${pill} px-3 py-1.5 text-sm ${
                        activa ? 'bg-text-1 text-bg' : 'border border-border bg-surface/80 text-text-1 backdrop-blur hover:border-border-strong'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${activa ? '' : cfg.ink}`} aria-hidden />
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Cómo funciona: tres secciones alternadas */}
        <div id="como-funciona" className="scroll-mt-16 border-t border-border">
          <Seccion
            titulo="Encuentra a alguien que te enseñe"
            texto="Vecinas y vecinos publican lo que saben hacer: cocina, idiomas, música, tecnología y más. Cada oferta dice cuánto tiempo toma."
            accion={
              <a href="#ofertas" className={`${pillClara} px-5 py-2.5 text-sm`}>
                Ver ofertas <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            }
          >
            <GlowCard>
              {muestra.length > 0 ? (
                <div className="w-full max-w-md space-y-4" style={{ ['--boleto-hueco' as string]: 'color-mix(in srgb, var(--surface) 95%, transparent)' }}>
                  {muestra.map((o) => (
                    <OfertaCardComponent key={o.id} oferta={o} categorias={categorias} href="/registro" />
                  ))}
                </div>
              ) : (
                <div className="w-full max-w-md space-y-4">
                  <OfertaCardSkeleton />
                  <OfertaCardSkeleton />
                </div>
              )}
            </GlowCard>
          </Seccion>

          <Seccion
            invertir
            titulo="Acuerden por mensaje"
            texto="Marca «Me interesa». Cuando la persona acepta, se abre un chat para ponerse de acuerdo en el día, la hora y el lugar."
          >
            <GlowCard>
              <ChatIlustracion />
            </GlowCard>
          </Seccion>

          <Seccion
            titulo="Todas las horas valen lo mismo"
            texto="Una hora de guitarra vale igual que una hora de inglés o de reparar una bicicleta. Lo que recibes lo devuelves compartiendo algo tuyo."
            accion={
              <Link to="/registro" className={`${pillOscura} px-5 py-2.5 text-sm`}>
                Crear cuenta
              </Link>
            }
          >
            <GlowCard>
              <IgualdadIlustracion />
            </GlowCard>
          </Seccion>
        </div>

        {/* Ofertas reales en una fila desplazable */}
        <section id="ofertas" className="scroll-mt-16 border-t border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium text-text-1 sm:text-[40px]">
                  {filtrando
                    ? `${total === 1 ? '1 oferta' : `${total} ofertas`}${categoriaActiva ? ` en ${categoriaActiva.nombre}` : ''}${q ? ` para «${q}»` : ''}`
                    : 'Publicadas hace poco'}
                </h2>
                {filtrando && (
                  <button type="button" onClick={limpiar} className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                    <X className="h-4 w-4" aria-hidden /> Quitar filtros
                  </button>
                )}
              </div>
              {ofertas.length > 1 && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => desplazar(-1)} aria-label="Ofertas anteriores" className={`${pillClara} h-10 w-10`}>
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => desplazar(1)} aria-label="Más ofertas" className={`${pillClara} h-10 w-10`}>
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <OfertaCardSkeleton key={i} />)}
              </div>
            ) : ofertas.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border-strong bg-surface p-10 text-center">
                <p className="font-display text-xl font-medium text-text-1">
                  {filtrando ? 'Todavía nadie ofrece eso' : 'Todavía no hay ofertas publicadas'}
                </p>
                <p className="mx-auto mt-2 max-w-md text-text-2">Si tú sabes hacerlo, puedes ser la primera persona en ofrecerlo.</p>
                <Link to="/registro" className={`${pillOscura} mt-6 px-5 py-2.5 text-sm`}>
                  Crear cuenta y ofrecer algo
                </Link>
              </div>
            ) : (
              <>
                <div
                  ref={filaRef}
                  className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {ofertas.map((oferta) => (
                    <div key={oferta.id} className="w-[85%] shrink-0 snap-start sm:w-[420px]">
                      <OfertaCardComponent oferta={oferta} categorias={categorias} href="/registro" />
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-text-2">
                  Para pedir una oferta necesitas una cuenta verificada.{' '}
                  <Link to="/registro" className="font-medium text-accent hover:underline">Crea la tuya</Link>
                  {total > ofertas.length && <> y mira las {total} ofertas.</>}
                </p>
              </>
            )}
          </div>
        </section>

        {/* Panel nocturno con partículas: la otra mitad del intercambio */}
        <section id="ensenar" className="scroll-mt-16 px-4 pb-16 sm:px-6">
          <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-night px-6 py-20 text-center text-[#F3E9F5] sm:px-12 sm:py-28">
            <div className="absolute inset-0 -z-10">
              <ParticleField palette={PALETA_NOCHE} dust="#5A3A60" spacing={26} />
            </div>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-medium leading-tight tracking-[-0.02em] sm:text-6xl">
              ¿Sabes hacer algo que a otros les sirva?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[#D9C8DD]">
              Arreglar una bicicleta, hacer pan, usar Excel, tejer. Publícalo y otras personas te devolverán ese tiempo
              con lo que ellas saben.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/registro" className={`${pill} bg-[#F3E9F5] px-6 py-3 text-sm text-night hover:bg-white`}>
                Crear cuenta y ofrecer algo
              </Link>
              <Link to="/login" className={`${pill} border border-[#F3E9F5]/30 px-6 py-3 text-sm hover:bg-white/10`}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 sm:grid-cols-3 sm:px-6">
          <p className="font-display text-xl font-medium text-text-1">Enseña una hora, aprende una hora.</p>
          <div>
            <p className="text-sm text-text-2">Plataforma</p>
            <ul className="mt-3 space-y-2 text-sm text-text-1">
              <li><a href="#como-funciona" className="hover:text-accent">Cómo funciona</a></li>
              <li><a href="#ofertas" className="hover:text-accent">Ofertas</a></li>
              <li><Link to="/registro" className="hover:text-accent">Crear cuenta</Link></li>
              <li><Link to="/login" className="hover:text-accent">Iniciar sesión</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm text-text-2">Plan Juárez</p>
            <ul className="mt-3 space-y-2 text-sm text-text-1">
              <li><Link to="/privacidad" className="hover:text-accent">Aviso de privacidad</Link></li>
            </ul>
          </div>
        </div>

        {/* Wordmark a todo lo ancho */}
        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6" aria-hidden>
          {/* SVG con textLength: el wordmark ocupa siempre el ancho exacto del contenedor. */}
          <svg viewBox="0 0 1000 150" className="block w-full select-none" role="presentation">
            <text
              x="0"
              y="128"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              className="fill-text-1 font-display"
              style={{ fontSize: 158, fontWeight: 500, letterSpacing: '-0.04em' }}
            >
              Banco de Tiempo
            </text>
          </svg>
        </div>

        <div className="mx-auto mt-8 flex max-w-6xl flex-col justify-between gap-2 border-t border-border px-4 py-6 text-sm text-text-2 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Plan Juárez</p>
          <p>Ciudad Juárez, Chihuahua</p>
        </div>
      </footer>
    </div>
  );
}
