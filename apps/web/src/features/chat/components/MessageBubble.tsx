import type { ChatMessage } from '@/lib/types';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = message.created_at?.toDate
    ? message.created_at.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? 'rounded-br-sm bg-accent text-white'
            : 'rounded-bl-sm border border-border bg-surface text-text-1'
        }`}
      >
        {!isOwn && (
          <p className="mb-0.5 text-xs font-semibold text-accent">{message.sender_name}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`mt-1 text-[10px] ${isOwn ? 'text-white/60' : 'text-text-3'}`}>{time}</p>
      </div>
    </div>
  );
}
