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
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { ChatTokenResponse, ChatMessage, ApiItem } from '@/lib/types';

const CHAT_APP_NAME = 'chat';

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
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let chatApp;
    try {
      chatApp = getApp(CHAT_APP_NAME);
    } catch {
      setLoading(false);
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
      },
      () => {
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !user) return;

      let chatApp;
      try {
        chatApp = getApp(CHAT_APP_NAME);
      } catch {
        return;
      }

      const db = getFirestore(chatApp);
      const chatAuth = getAuth(chatApp);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');

      await addDoc(messagesRef, {
        text: text.trim(),
        sender_id: user.id,
        sender_uid: chatAuth.currentUser?.uid ?? '',
        sender_name: user.nombre,
        created_at: serverTimestamp(),
      });
    },
    [conversationId, user],
  );

  return { messages, loading, sendMessage };
}
