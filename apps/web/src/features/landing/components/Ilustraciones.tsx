/**
 * Ilustraciones de producto para la landing. Muestran cómo se ve la
 * interfaz; no representan personas ni datos reales.
 */

export function ChatIlustracion() {
  const burbujas = [
    { propia: false, texto: 'Hola, vi tu oferta de guitarra. ¿Te queda el sábado?' },
    { propia: true, texto: 'Sí, a las 10. ¿En el centro comunitario?' },
    { propia: false, texto: 'Perfecto, ahí nos vemos.' },
  ];
  return (
    <div className="w-full max-w-sm space-y-3" aria-hidden>
      {burbujas.map((b, i) => (
        <div key={i} className={`flex ${b.propia ? 'justify-end' : 'justify-start'}`}>
          <p
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              b.propia ? 'rounded-br-md bg-accent text-on-accent' : 'rounded-bl-md border border-border bg-surface text-text-1'
            }`}
          >
            {b.texto}
          </p>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-text-3">
        Escribe un mensaje…
      </div>
    </div>
  );
}

function Talon({ etiqueta }: { etiqueta: string }) {
  return (
    <div className="boleto-talon flex h-40 w-32 flex-col items-center justify-center rounded-r-xl text-center sm:h-48 sm:w-36" style={{ ['--boleto-hueco' as string]: 'var(--surface)' }}>
      <span className="font-display text-5xl font-bold leading-none">1 h</span>
      <span className="mt-2 px-2 text-sm leading-tight">{etiqueta}</span>
    </div>
  );
}

export function IgualdadIlustracion() {
  return (
    <div className="flex items-center gap-4 sm:gap-6" aria-hidden>
      <Talon etiqueta="de guitarra" />
      <span className="font-display text-5xl font-semibold text-text-2">=</span>
      <Talon etiqueta="de inglés" />
    </div>
  );
}
