import { useDeferredValue, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useCategorias } from '@/features/ofertas/hooks/useCategorias';
import { useExplorarOfertas } from '@/features/ofertas/hooks/useOfertas';
import OfertaCardComponent from '@/features/ofertas/components/OfertaCardComponent';
import { OfertaCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { getCategoryConfig } from '@/lib/categoryConfig';
import ThemeToggle from '@/components/ui/ThemeToggle';

const pasos = [
  {
    titulo: 'Busca lo que quieres aprender',
    desc: 'Vecinas y vecinos de Ciudad Juárez publican lo que saben hacer: cocina, idiomas, música, tecnología y más.',
  },
  {
    titulo: 'Pide la oferta y acuerden por mensaje',
    desc: 'Marca «Me interesa». Cuando la persona acepta, se abre un chat para acordar día, hora y lugar.',
  },
  {
    titulo: 'Devuelve el tiempo enseñando',
    desc: 'Cada hora que recibes la devuelves compartiendo algo que sabes. Al terminar, se dejan una reseña.',
  },
];

export default function WelcomePage() {
  const { user, initialized, loading } = useAuthStore();
  const { data: categorias } = useCategorias();
  const categoriasActivas = (categorias ?? []).filter((c) => c.activa);

  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const q = useDeferredValue(texto.trim());

  const { data: resultados, isLoading } = useExplorarOfertas({
    q: q || undefined,
    categoria_id: categoriaId ?? undefined,
    per_page: 6,
  });
  const ofertas = resultados?.data ?? [];
  const total = resultados?.meta.total ?? 0;
  const filtrando = Boolean(q) || categoriaId !== null;
  const categoriaActiva = categoriasActivas.find((c) => Number(c.id) === categoriaId);

  // Si ya está autenticado, mandarlo al home autenticado
  if (!loading && initialized && user) {
    return <Navigate to="/inicio" replace />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const limpiar = () => {
    setTexto('');
    setCategoriaId(null);
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/logo.png" alt="Participa Juárez" className="brand-logo h-9 w-auto shrink-0" />
            <span className="truncate font-display text-base font-bold text-text-1">Banco de Tiempo</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle hideSystem />
            </div>
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover sm:inline-flex"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: la búsqueda es la primera acción */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-20">
          <p className="text-sm font-medium text-accent">Banco de Tiempo de Plan Juárez</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-text-1 sm:text-6xl">
            Enseña una hora, aprende una hora.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-text-2">
            Aquí nadie paga con dinero. Compartes lo que sabes con tus vecinos y, a cambio, aprendes lo que te
            hace falta. La única moneda es el tiempo.
          </p>

          <form onSubmit={onSubmit} role="search" className="mt-8 max-w-2xl">
            <label htmlFor="buscar" className="mb-2 block font-display text-lg font-semibold text-text-1">
              ¿Qué quieres aprender?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" aria-hidden />
                <input
                  id="buscar"
                  type="search"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Guitarra, inglés, cocina…"
                  className="h-14 w-full rounded-xl border border-border-strong bg-surface pl-12 pr-4 text-base text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                />
              </div>
              <button
                type="submit"
                className="h-14 rounded-xl bg-accent px-6 text-base font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Buscar
              </button>
            </div>
          </form>

          {categoriasActivas.length > 0 && (
            <div className="mt-5 flex max-w-3xl flex-wrap gap-2" aria-label="Filtrar por categoría">
              {categoriasActivas.map((cat) => {
                const cfg = getCategoryConfig(cat.slug);
                const Icon = cfg.icon;
                const activa = categoriaId === Number(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => setCategoriaId(activa ? null : Number(cat.id))}
                    className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm transition-colors ${
                      activa
                        ? 'border-accent bg-accent text-on-accent'
                        : 'border-border bg-surface text-text-1 hover:border-border-strong'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${activa ? '' : cfg.ink}`} aria-hidden />
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Ofertas reales */}
        <section id="ofertas" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-bold text-text-1">
              {filtrando
                ? `${total === 1 ? '1 oferta' : `${total} ofertas`}${categoriaActiva ? ` en ${categoriaActiva.nombre}` : ''}${q ? ` para «${q}»` : ''}`
                : 'Publicadas hace poco'}
            </h2>
            {filtrando && (
              <button type="button" onClick={limpiar} className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                <X className="h-4 w-4" aria-hidden /> Quitar filtros
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <OfertaCardSkeleton key={i} />)}
            </div>
          ) : ofertas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface p-8 text-center">
              <p className="font-display text-lg font-semibold text-text-1">
                {filtrando ? 'Todavía nadie ofrece eso' : 'Todavía no hay ofertas publicadas'}
              </p>
              <p className="mx-auto mt-2 max-w-md text-text-2">
                Si tú sabes hacerlo, puedes ser la primera persona en ofrecerlo.
              </p>
              <Link
                to="/registro"
                className="mt-5 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-on-accent hover:bg-accent-hover"
              >
                Crear cuenta y ofrecer algo
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ofertas.map((oferta) => (
                  <OfertaCardComponent key={oferta.id} oferta={oferta} categorias={categorias} href="/registro" />
                ))}
              </div>
              <p className="mt-4 text-sm text-text-2">
                Para pedir una oferta necesitas una cuenta verificada.{' '}
                <Link to="/registro" className="font-medium text-accent hover:underline">Crea la tuya</Link>
                {total > ofertas.length && <> y mira las {total} ofertas.</>}
              </p>
            </>
          )}
        </section>

        {/* Cómo funciona: sí es una secuencia, por eso va numerada */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-text-1 sm:text-3xl">Cómo funciona</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {pasos.map((paso, i) => (
                <li key={paso.titulo} className="flex gap-4 md:flex-col md:gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent font-display text-lg font-bold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-text-1">{paso.titulo}</h3>
                    <p className="mt-1 text-text-2">{paso.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ofrecer: la otra mitad del intercambio */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl bg-night px-6 py-10 text-[#F3E9F5] sm:px-10">
            <h2 className="max-w-2xl font-display text-2xl font-bold sm:text-3xl">
              ¿Sabes hacer algo que a otros les sirva?
            </h2>
            <p className="mt-3 max-w-2xl text-[#D9C8DD]">
              Arreglar una bicicleta, hacer pan, usar Excel, tejer. Lo que sabes vale horas aquí.
              Publícalo y otras personas te devolverán ese tiempo con lo que ellas saben.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/registro"
                className="inline-flex rounded-lg bg-[#E7C9EB] px-5 py-3 text-sm font-semibold text-night transition-colors hover:bg-[#F1DCF3]"
              >
                Crear cuenta y ofrecer algo
              </Link>
              <Link
                to="/login"
                className="inline-flex rounded-lg border border-[#F3E9F5]/30 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-text-2 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Plan Juárez · Banco de Tiempo</p>
          <Link to="/privacidad" className="hover:text-accent">Aviso de privacidad</Link>
        </div>
      </footer>
    </div>
  );
}
