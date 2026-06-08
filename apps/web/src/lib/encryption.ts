/**
 * Cifra un documento con AES-256-GCM usando Web Crypto API.
 * Retorna IV (12 bytes) + ciphertext concatenados.
 */
export async function encryptDocument(data: ArrayBuffer, keyBase64: string): Promise<ArrayBuffer> {
  // Derivar una clave de 256 bits desde el keyRef (usamos SHA-256 para normalizar)
  const keyMaterial = new TextEncoder().encode(keyBase64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyMaterial);

  const key = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  // Concatenar IV + ciphertext
  const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.byteLength);

  return result.buffer;
}
