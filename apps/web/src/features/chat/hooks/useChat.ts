import { useState, useEffect, useCallback } from 'react';
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
export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let chatApp;
    try {
      chatApp = getChatApp();
    } catch {
      setLoading(false);
      setListenerError('No se pudo inicializar el chat.');
      return;
    }

    const db = getFirestore(chatApp);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];
        setMessages(msgs);
        setLoading(false);
        setListenerError(null);
      },
      (error) => {
        console.error('[Chat] Listener error:', error);
        setLoading(false);
        setListenerError(
          error.code === 'permission-denied'
            ? 'Sin permiso para leer mensajes. Verifica que las Firestore Rules esten desplegadas.'
            : `Error al escuchar mensajes: ${error.message}`,
        );
      },
    );

    return unsubscribe;
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !user) {
        throw new Error('Chat no conectado.');
      }

      const chatApp = getChatApp();
      const db = getFirestore(chatApp);
      const chatAuth = getAuth(chatApp);

      if (!chatAuth.currentUser) {
        throw new Error('No autenticado en el chat. Recarga la pagina.');
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
