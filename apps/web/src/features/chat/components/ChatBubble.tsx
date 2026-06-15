import { Minus, X, MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import ChatWindow from './ChatWindow';
import { useBubbleStore } from '@/stores/bubbleStore';

export default function ChatBubble() {
  const { estado, vinculacionId, contraparte, ofertaTitulo, otroInactivo, minimizar, restaurar, cerrar } =
    useBubbleStore();

  if (estado === 'cerrada' || vinculacionId === null || contraparte === null) {
    return null;
  }

  if (estado === 'minimizada') {
    return (
      <div
        className="fixed bottom-4 right-4 z-40 w-72 overflow-hidden rounded-full border border-border bg-surface shadow-lg"
        role="region"
        aria-label="Chat minimizado"
      >
        <button
          onClick={restaurar}
          aria-label="Restaurar chat"
          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2"
        >
          <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
            {ofertaTitulo && <p className="truncate text-xs text-text-3">{ofertaTitulo}</p>}
          </div>
          <MessageCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg max-sm:inset-x-2 max-sm:bottom-2 max-sm:h-[70vh] max-sm:w-auto"
      role="dialog"
      aria-label={`Chat con ${contraparte.nombre}`}
    >
      <header className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <Avatar src={contraparte.foto} nombre={contraparte.nombre} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-1">{contraparte.nombre}</p>
          {ofertaTitulo && <p className="truncate text-xs text-text-3">{ofertaTitulo}</p>}
        </div>
        <button
          onClick={minimizar}
          aria-label="Minimizar chat"
          className="rounded-md p-1 text-text-3 transition-colors hover:bg-surface hover:text-text-1"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={cerrar}
          aria-label="Cerrar chat"
          className="rounded-md p-1 text-text-3 transition-colors hover:bg-surface hover:text-error"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWindow vinculacionId={vinculacionId} otroInactivo={otroInactivo} variant="bubble" />
      </div>
    </div>
  );
}
