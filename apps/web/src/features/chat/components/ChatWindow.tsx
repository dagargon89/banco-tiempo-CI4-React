import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChatToken, useChatMessages } from '../hooks/useChat';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  vinculacionId: number;
  otroInactivo?: boolean;
  variant?: 'embedded' | 'bubble';
}

export default function ChatWindow({ vinculacionId, otroInactivo, variant = 'embedded' }: Props) {
  const user = useAuthStore((s) => s.user);
  const { isConnected, conversationId, error, connectToChat, disconnect } = useChatStore();
  const chatToken = useChatToken();
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    listenerError,
    sendError,
  } = useChatMessages(isConnected ? conversationId : null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectingRef = useRef(false);

  // Conectar al montar
  useEffect(() => {
    if (!isConnected && !chatToken.isPending && !connectingRef.current) {
      connectingRef.current = true;
      chatToken.mutate(vinculacionId, {
        onSuccess: async (data) => {
          await connectToChat(data.firebase_custom_token, data.conversation_id);
          connectingRef.current = false;
        },
        onError: () => {
          connectingRef.current = false;
        },
      });
    }

    return () => {
      disconnect();
      connectingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculacionId]);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (chatToken.isPending || connectingRef.current) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="ml-3 text-sm text-text-2">Conectando al chat...</span>
      </div>
    );
  }

  if (error || chatToken.isError) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error">
        {error ?? 'No se pudo conectar al chat. Intenta de nuevo.'}
      </div>
    );
  }

  return (
    <div
      className={
        variant === 'bubble'
          ? 'flex h-full flex-col overflow-hidden bg-surface'
          : 'flex flex-col overflow-hidden rounded-xl border border-border bg-surface'
      }
    >
      {/* Header */}
      {variant !== 'bubble' && (
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
          <MessageCircle className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-1">Chat</h3>
          {isConnected && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Conectado
            </span>
          )}
        </div>
      )}

      {/* Listener error */}
      {listenerError && (
        <div className="border-b border-error/20 bg-error/5 px-4 py-2 text-xs text-error">
          {listenerError}
        </div>
      )}

      {/* Messages */}
      <div
        className={
          variant === 'bubble'
            ? 'flex flex-1 flex-col gap-2 overflow-y-auto p-4'
            : 'flex max-h-96 min-h-[200px] flex-col gap-2 overflow-y-auto p-4'
        }
      >
        {messagesLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-8 w-8" />}
            title="Sin mensajes"
            subtitle="Envia el primer mensaje para iniciar la conversacion"
          />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={!isConnected || otroInactivo}
        disabledReason={otroInactivo ? 'Esta cuenta fue dada de baja. Puedes leer el historial pero no enviar nuevos mensajes.' : undefined}
        error={sendError}
      />
    </div>
  );
}
