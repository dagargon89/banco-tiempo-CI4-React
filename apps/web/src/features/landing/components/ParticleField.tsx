import { useEffect, useRef } from 'react';

interface Props {
  className?: string;
  /** Separación media entre partículas, en px CSS. */
  spacing?: number;
  /** El anillo sigue al puntero. Si es false, deriva solo. */
  followPointer?: boolean;
  /** Colores fijos [3 tonos de anillo, 1 acento de tiempo] y del polvo. Sin ellos se usan los del tema. */
  palette?: string[];
  dust?: string;
}

interface Particle {
  x: number;
  y: number;
  /** Fase propia para que el anillo no se vea perfecto. */
  seed: number;
  /** Índice de color dentro de la paleta del anillo. */
  tone: number;
}

function leerColor(nombre: string, respaldo: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return v || respaldo;
}

/**
 * Campo de guiones diminutos. Los que caen cerca de un anillo que sigue al
 * puntero se orientan hacia su centro, crecen y toman los colores de la marca;
 * el resto queda como polvo gris. Pausa fuera de pantalla y respeta
 * prefers-reduced-motion dibujando un solo cuadro estático.
 */
export default function ParticleField({ className = '', spacing = 30, followPointer = true, palette, dust }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let colores: string[] = [];
    let polvo = '';
    let raf = 0;
    let visible = true;
    let t0 = performance.now();

    // Centro del anillo (suavizado) y objetivo (puntero).
    const centro = { x: 0, y: 0 };
    const objetivo = { x: 0, y: 0, activo: false };

    const cargarColores = () => {
      if (palette && palette.length >= 4) {
        colores = palette;
        polvo = dust ?? '#5A3A60';
        return;
      }
      colores = [
        leerColor('--particle-1', '#7A3B82'),
        leerColor('--particle-2', '#C2459A'),
        leerColor('--particle-3', '#4C5FB0'),
        leerColor('--particle-4', '#8A9A12'),
      ];
      polvo = leerColor('--particle-dust', '#CDBFD2');
    };

    const construir = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = [];
      const sep = width < 640 ? spacing * 1.25 : spacing;
      for (let y = sep / 2; y < height; y += sep) {
        for (let x = sep / 2; x < width; x += sep) {
          particles.push({
            x: x + (Math.random() - 0.5) * sep * 0.8,
            y: y + (Math.random() - 0.5) * sep * 0.8,
            seed: Math.random() * Math.PI * 2,
            // El cuarto tono (lima, el tiempo) aparece poco: es un acento.
            tone: Math.random() < 0.16 ? 3 : Math.floor(Math.random() * 3),
          });
        }
      }
      if (!objetivo.activo) {
        centro.x = width * 0.62;
        centro.y = height * 0.55;
      }
    };

    const dibujar = (ahora: number) => {
      const t = (ahora - t0) / 1000;

      if (!objetivo.activo) {
        // Deriva lenta en forma de ocho cuando no hay puntero.
        objetivo.x = width * (0.5 + 0.22 * Math.sin(t * 0.25));
        objetivo.y = height * (0.52 + 0.16 * Math.sin(t * 0.5));
      }
      centro.x += (objetivo.x - centro.x) * 0.06;
      centro.y += (objetivo.y - centro.y) * 0.06;

      const radio = Math.min(width, height) * (0.32 + 0.03 * Math.sin(t * 0.8));
      const banda = Math.max(70, radio * 0.45);

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';

      for (const p of particles) {
        const dx = p.x - centro.x;
        const dy = p.y - centro.y;
        const d = Math.hypot(dx, dy) || 1;
        const ondula = Math.sin(p.seed + t * 1.4) * 10;
        const cercania = Math.max(0, 1 - Math.abs(d - radio - ondula) / banda);

        if (cercania <= 0.02) {
          ctx.fillStyle = polvo;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(p.x, p.y, 1.4, 1.4);
          continue;
        }

        const largo = 1.5 + cercania * 5.5;
        const ux = dx / d;
        const uy = dy / d;
        // Las partículas del anillo empujan hacia afuera, como atraídas.
        const empuje = cercania * 6;
        const x = p.x + ux * empuje;
        const y = p.y + uy * empuje;

        ctx.strokeStyle = colores[p.tone];
        ctx.globalAlpha = 0.25 + cercania * 0.75;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - (ux * largo) / 2, y - (uy * largo) / 2);
        ctx.lineTo(x + (ux * largo) / 2, y + (uy * largo) / 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const bucle = (ahora: number) => {
      dibujar(ahora);
      if (visible && !reducir) raf = requestAnimationFrame(bucle);
    };

    const arrancar = () => {
      cancelAnimationFrame(raf);
      if (reducir) {
        dibujar(t0 + 2000);
        return;
      }
      raf = requestAnimationFrame(bucle);
    };

    cargarColores();
    construir();
    arrancar();

    const onResize = () => {
      construir();
      if (reducir) dibujar(t0 + 2000);
    };
    const onPointer = (e: PointerEvent) => {
      if (!followPointer) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        objetivo.activo = false;
        return;
      }
      objetivo.activo = true;
      objetivo.x = x;
      objetivo.y = y;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === 'visible';
      if (visible) arrancar();
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
      if (visible) {
        t0 = performance.now() - 1000;
        arrancar();
      } else cancelAnimationFrame(raf);
    };

    // El tema cambia la clase de <html>: recargar colores.
    const mo = new MutationObserver(() => {
      cargarColores();
      if (reducir) dibujar(t0 + 2000);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  // palette se compara por contenido para no reiniciar en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacing, followPointer, palette?.join(','), dust]);

  return <canvas ref={canvasRef} className={`pointer-events-none block h-full w-full ${className}`} aria-hidden />;
}
