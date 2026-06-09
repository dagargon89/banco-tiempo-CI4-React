import { create } from 'zustand';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
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

function getChatApp() {
  try {
    return getApp(CHAT_APP_NAME);
  } catch {
    return initializeApp(firebaseConfig, CHAT_APP_NAME);
  }
}

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
      set({ error: e.message ?? 'Error al conectar al chat', isConnected: false });
    }
  },

  disconnect: async () => {
    try {
      const chatApp = getChatApp();
      const chatAuth = getAuth(chatApp);
      await signOut(chatAuth);
      await deleteApp(chatApp);
    } catch {
      // App might not exist
    }
    set({ isConnected: false, conversationId: null, error: null });
  },
}));
