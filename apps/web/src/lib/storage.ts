import { ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Sube un blob cifrado a Firebase Storage.
 * Usa la instancia principal de Firebase Storage (el token de auth ya está configurado).
 */
export async function uploadEncryptedToStorage(
  blob: Blob,
  path: string,
  _uploadToken: string,
  contentType: string,
): Promise<void> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, {
    contentType,
    customMetadata: { encrypted: 'true' },
  });
}
