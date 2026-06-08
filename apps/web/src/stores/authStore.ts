import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, microsoftProvider } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

interface AuthState {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Acciones
  loginEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginFacebook: () => Promise<void>;
  loginMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  clearError: () => void;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  initialized: false,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        set({ firebaseUser: fbUser });
        try {
          await get().syncWithBackend();
        } catch {
          set({ user: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, firebaseUser: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },

  syncWithBackend: async () => {
    try {
      const { data } = await api.post<{ data: AuthUser }>('/auth/sync');
      set({ user: data.data, loading: false, error: null, initialized: true });
    } catch {
      set({ user: null, loading: false, initialized: true });
      throw new Error('Error al sincronizar con el servidor.');
    }
  },

  loginEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  register: async (email, password, _nombre) => {
    set({ loading: true, error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  loginGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  loginFacebook: async () => {
    set({ loading: true, error: null });
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  loginMicrosoft: async () => {
    set({ loading: true, error: null });
    try {
      await signInWithPopup(auth, microsoftProvider);
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, firebaseUser: null });
  },

  clearError: () => set({ error: null }),
}));

function firebaseErrorMsg(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email': 'Correo electrónico inválido.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Credenciales inválidas.',
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro proveedor.',
  };
  return map[code] ?? 'Error de autenticación. Intenta de nuevo.';
}
