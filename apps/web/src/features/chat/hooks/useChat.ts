import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { getChatApp } from '@/stores/chatStore';
import type { ChatTokenResponse, ChatMessage, ApiItem } from '@/lib/types';

/** Obtiene el Custom Token para una vinculación. */
export function useChatToken() {
  return useMutation({
    mutationFn: async (vinculacionId: number) => {
      const { data } = await api.post<ApiItem<ChatTokenResponse>>(
        `/vinculaciones/${vinculacionId}/chat/token`,
      );
      return data.data;
    },
  });
}

/** Escucha mensajes en tiempo real de una conversación Firestore. */
const SIN_MENSAJES: ChatMessage[] = [];

interface Snapshot {
  conversationId: string;
  messages: ChatMessage[];
  error: string | null;
}

export function useChatMessages(conversationId: string | null) {
  // Cada instantánea guarda la conversación a la que pertenece; así el estado
  // se deriva en el render y el efecto solo escribe desde los callbacks.
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const initError = useMemo(() => {
    if (!conversationId) return null;
    try {
      getChatApp();
      return null;
    } catch {
      return 'No se pudo inicializar el chat.';
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || initError) return;

    const db = getFirestore(getChatApp());
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const msgs: ChatMessage[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];
        setSnapshot({ conversationId, messages: msgs, error: null });
      },
      (error) => {
        console.error('[Chat] Listener error:', error);
        const msg =
          error.code === 'permission-denied'
            ? 'Sin permiso para leer mensajes. Verifica que las Firestore Rules estén desplegadas.'
            : `Error al escuchar mensajes: ${error.message}`;
        setSnapshot((prev) => ({
          conversationId,
          messages: prev?.conversationId === conversationId ? prev.messages : [],
          error: msg,
        }));
      },
    );

    return unsubscribe;
  }, [conversationId, initError]);

  const current = snapshot && snapshot.conversationId === conversationId ? snapshot : null;
  const messages = current?.messages ?? SIN_MENSAJES;
  const loading = !!conversationId && !initError && !current;
  const listenerError = initError ?? current?.error ?? null;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !user) {
        throw new Error('Chat no conectado.');
      }

      const chatApp = getChatApp();
      const db = getFirestore(chatApp);
      const chatAuth = getAuth(chatApp);

      if (!chatAuth.currentUser) {
        throw new Error('No autenticado en el chat. Recarga la página.');
      }

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');

      try {
        setSendError(null);
        await addDoc(messagesRef, {
          text: text.trim(),
          sender_id: user.id,
          sender_uid: chatAuth.currentUser.uid,
          sender_name: user.nombre,
          created_at: serverTimestamp(),
        });
      } catch (error: any) {
        console.error('[Chat] Error al enviar mensaje:', error);
        const msg =
          error.code === 'permission-denied'
            ? 'Sin permiso para enviar. Verifica que las Firestore Rules esten desplegadas.'
            : `Error al enviar: ${error.message}`;
        setSendError(msg);
        throw new Error(msg);
      }
    },
    [conversationId, user],
  );

  return { messages, loading, sendMessage, listenerError, sendError };
}
