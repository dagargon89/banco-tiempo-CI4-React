import { create } from 'zustand';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';

interface ChatState {
  isConnected: boolean;
  conversationId: string | null;
  error: string | null;
  connectToChat: (customToken: string, conversationId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const CHAT_APP_NAME = 'chat';

/** Obtiene o crea la instancia secundaria de Firebase para el chat. */
function getChatApp() {
  try {
    return getApp(CHAT_APP_NAME);
  } catch {
    return initializeApp(firebaseConfig, CHAT_APP_NAME);
  }
}

export { getChatApp, CHAT_APP_NAME };

export const useChatStore = create<ChatState>((set) => ({
  isConnected: false,
  conversationId: null,
  error: null,

  connectToChat: async (customToken, conversationId) => {
    try {
      set({ error: null });
      const chatApp = getChatApp();
      const chatAuth = getAuth(chatApp);
      await signInWithCustomToken(chatAuth, customToken);
      set({ isConnected: true, conversationId });
    } catch (e: any) {
      console.error('[Chat] Error al conectar:', e);
      set({ error: e.message ?? 'Error al conectar al chat', isConnected: false });
    }
  },

  disconnect: async () => {
    // Limpiar el store inmediatamente (síncrono) antes del await signOut,
    // para que una reconexión posterior no sea sobreescrita por este set.
    set({ isConnected: false, conversationId: null, error: null });
    try {
      const chatApp = getApp(CHAT_APP_NAME);
      const chatAuth = getAuth(chatApp);
      await signOut(chatAuth);
      // NO borrar la app — signOut es suficiente y evita problemas con StrictMode
    } catch {
      // App might not exist
    }
  },
}));
