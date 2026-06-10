import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  error?: string | null;
}

export default function ChatInput({ onSend, disabled, error }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setLocalError(null);
    try {
      await onSend(trimmed);
      setText('');
    } catch (err: any) {
      setLocalError(err.message ?? 'Error al enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const displayError = localError ?? error;

  return (
    <div className="border-t border-border bg-surface">
      {displayError && (
        <p className="px-3 pt-2 text-xs text-error">{displayError}</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, 2000));
            if (localError) setLocalError(null);
          }}
          placeholder="Escribe un mensaje..."
          disabled={disabled || sending}
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
