import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { api } from '@/lib/api';
import type { AuthUser } from '@/lib/types';
import { useBubbleStore } from '@/stores/bubbleStore';

interface AuthState {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  loginEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  syncWithBackend: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
        set({ firebaseUser: fbUser, loading: true });
        try {
          await get().syncWithBackend();
        } catch (err: any) {
          const detail = err?.response?.status
            ? `Error ${err.response.status}: ${JSON.stringify(err.response.data)}`
            : err?.message ?? 'Sin conexión';
          console.error('syncWithBackend failed:', detail);
          await signOut(auth).catch(() => {});
          set({
            user: null,
            firebaseUser: null,
            loading: false,
            initialized: true,
            error: `No se pudo conectar con el servidor (${detail})`,
          });
        }
      } else {
        set({ user: null, firebaseUser: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },

  setUser: (user: AuthUser) => set({ user }),

  syncWithBackend: async () => {
    const { data } = await api.post<{ data: AuthUser }>('/auth/sync');
    set({ user: data.data, loading: false, error: null, initialized: true });
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get<{ data: AuthUser }>('/me');
      set({ user: data.data });
    } catch {
      // silently fail — user data remains stale until next sync
    }
  },

  loginEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged se encarga del sync
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  register: async (email, password, nombre) => {
    set({ loading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged se encarga del sync, pero el ID token recién emitido no
      // trae el nombre: la API aprovisionaría al usuario con el prefijo del correo.
      // Se guarda el nombre en Firebase y en la API, y luego se refresca el usuario.
      const limpio = nombre.trim();
      if (limpio !== '') {
        await updateProfile(cred.user, { displayName: limpio }).catch(() => {});
        try {
          await api.patch('/me', { nombre: limpio });
          await get().refreshUser();
        } catch {
          // El nombre se puede corregir después desde el perfil.
        }
      }
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  loginGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged se encarga del sync
    } catch (e: any) {
      set({ loading: false, error: firebaseErrorMsg(e.code) });
    }
  },

  logout: async () => {
    await signOut(auth);
    useBubbleStore.getState().cerrar();
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
