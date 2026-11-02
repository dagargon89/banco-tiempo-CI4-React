import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase before importing the store
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  GoogleAuthProvider: vi.fn(),
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      firebaseUser: null,
      loading: true,
      error: null,
      initialized: false,
    });
  });

  it('estado inicial es null para user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.firebaseUser).toBeNull();
  });

  it('setUser actualiza usuario', () => {
    const mockUser = {
      id: 1,
      nombre: 'Test User',
      email: 'test@test.com',
      email_verificado: true,
      estado_verificacion: 'verificado' as const,
      roles: [],
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('clearError limpia error', () => {
    useAuthStore.setState({ error: 'Algo salió mal' });
    expect(useAuthStore.getState().error).toBe('Algo salió mal');

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('logout limpia estado', async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        email_verificado: true,
        estado_verificacion: 'verificado',
        roles: [],
      },
      firebaseUser: {} as any,
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().firebaseUser).toBeNull();
  });

  it('register guarda el nombre en Firebase y en la API', async () => {
    const fbUser = { uid: 'u1' };
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({ user: fbUser } as any);
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { nombre: 'Ana López' } } } as any);

    await useAuthStore.getState().register('ana@correo.mx', 'secreto123', '  Ana López ');

    expect(updateProfile).toHaveBeenCalledWith(fbUser, { displayName: 'Ana López' });
    expect(api.patch).toHaveBeenCalledWith('/me', { nombre: 'Ana López' });
    expect(useAuthStore.getState().user).toEqual({ nombre: 'Ana López' });
  });
});
