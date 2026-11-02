// Inicialización del SDK de Firebase (cliente) — auth + storage.
// Solo claves públicas VITE_*. La autoridad de identidad y permisos vive en la API (CI4).
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

/**
 * Desarrollo local con Firebase Emulator Suite (`npm run emulators`).
 * Solo se activa en el servidor de desarrollo de Vite: un build de producción
 * nunca apunta a los emuladores aunque la variable quede definida.
 */
export const usarEmuladores =
  import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

const EMULATOR_HOST = import.meta.env.VITE_FIREBASE_EMULATOR_HOST ?? '127.0.0.1';
const EMULATOR_PROJECT_ID = import.meta.env.VITE_FIREBASE_EMULATOR_PROJECT_ID ?? 'demo-banco-de-tiempo';

/** Configuración Firebase exportada para instancias secundarias (chat). */
export const firebaseConfig = usarEmuladores
  ? {
      // Los emuladores aceptan cualquier apiKey; el projectId debe coincidir con el de la API.
      apiKey: 'demo-api-key',
      authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
      projectId: EMULATOR_PROJECT_ID,
      storageBucket: `${EMULATOR_PROJECT_ID}.appspot.com`,
      appId: 'demo-app-id',
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

const appsConectadas = new WeakSet<FirebaseApp>();

/**
 * Conecta Auth, Firestore y Storage de una app a los emuladores. Debe llamarse
 * justo después de initializeApp y antes de cualquier uso. Idempotente.
 */
export function conectarEmuladores(firebaseApp: FirebaseApp): void {
  if (!usarEmuladores || appsConectadas.has(firebaseApp)) return;
  appsConectadas.add(firebaseApp);
  connectAuthEmulator(getAuth(firebaseApp), `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(getFirestore(firebaseApp), EMULATOR_HOST, 8085);
  connectStorageEmulator(getStorage(firebaseApp), EMULATOR_HOST, 9199);
}

const app = initializeApp(firebaseConfig);
conectarEmuladores(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Proveedores habilitados en el MVP (ADR-008).
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');
