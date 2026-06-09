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
}

export default function ChatWindow({ vinculacionId }: Props) {
  const user = useAuthStore((s) => s.user);
  const { isConnected, conversationId, error, connectToChat, disconnect } = useChatStore();
  const chatToken = useChatToken();
  const { messages, loading: messagesLoading, sendMessage } = useChatMessages(
    isConnected ? conversationId : null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conectar al montar
  useEffect(() => {
    if (!isConnected && !chatToken.isPending) {
      chatToken.mutate(vinculacionId, {
        onSuccess: async (data) => {
          await connectToChat(data.firebase_custom_token, data.conversation_id);
        },
      });
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculacionId]);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (chatToken.isPending) {
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      {/* Header */}
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

      {/* Messages */}
      <div className="flex max-h-96 min-h-[200px] flex-col gap-2 overflow-y-auto p-4">
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
      <ChatInput onSend={sendMessage} disabled={!isConnected} />
    </div>
  );
}
