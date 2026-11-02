<?php

declare(strict_types=1);

namespace App\Services;

use Kreait\Firebase\Factory;

final class FirebaseStorageService
{
    private \Google\Cloud\Storage\StorageClient $storage;
    private string $bucket;

    /** Host del emulador de Storage (p. ej. 127.0.0.1:9199) o null en modo real. */
    private ?string $emulatorHost = null;

    public function __construct()
    {
        // Desarrollo local con Firebase Emulator Suite: sin cuenta de servicio.
        $this->emulatorHost = FirebaseEmulator::storageHost();
        if ($this->emulatorHost !== null) {
            $projectId    = FirebaseEmulator::projectId();
            $this->bucket = (string) env('FIREBASE_STORAGE_BUCKET', '') ?: "{$projectId}.appspot.com";
            // La API compatible con GCS del emulador actúa como Admin SDK (ignora reglas).
            $this->storage = new \Google\Cloud\Storage\StorageClient([
                'apiEndpoint'        => 'http://' . $this->emulatorHost,
                'projectId'          => $projectId,
                'credentialsFetcher' => new \Google\Auth\Credentials\InsecureCredentials(),
            ]);

            return;
        }

        $credentials = env('FIREBASE_CREDENTIALS', '');
        if ($credentials === '' || ! file_exists($credentials)) {
            throw new \RuntimeException('FIREBASE_CREDENTIALS no configurado o archivo inexistente.');
        }

        $this->bucket = env('FIREBASE_STORAGE_BUCKET', '');
        if ($this->bucket === '') {
            throw new \RuntimeException('FIREBASE_STORAGE_BUCKET no configurado.');
        }

        $factory = (new Factory())->withServiceAccount($credentials);
        $this->storage = $factory->createStorage()->getStorageClient();
    }

    /** Genera una URL firmada de lectura con expiración. */
    public function getSignedUrl(string $path, int $expiresInSeconds = 300): string
    {
        if ($this->emulatorHost !== null) {
            return $this->emulatorDownloadUrl($path);
        }

        $bucket = $this->storage->bucket($this->bucket);
        $object = $bucket->object($path);

        $url = $object->signedUrl(
            new \DateTime("+{$expiresInSeconds} seconds"),
            ['version' => 'v4']
        );

        return $url;
    }

    /** Descarga el contenido de un objeto. */
    public function download(string $path): string
    {
        $bucket = $this->storage->bucket($this->bucket);
        $object = $bucket->object($path);

        return $object->downloadAsString();
    }

    /** Sube contenido a una ruta en el bucket. */
    public function upload(string $path, string $content, string $contentType): void
    {
        if ($this->emulatorHost !== null) {
            $this->emulatorUpload($path, $content, $contentType);

            return;
        }

        $bucket = $this->storage->bucket($this->bucket);
        $bucket->upload($content, [
            'name'          => $path,
            'metadata'      => ['contentType' => $contentType],
        ]);
    }

    /**
     * Sube contenido y retorna una URL firmada de larga duración (7 días).
     * Útil para fotos de perfil y otros assets semi-públicos.
     */
    public function uploadAndGetUrl(string $path, string $content, string $contentType, int $expiresInSeconds = 604800): string
    {
        $this->upload($path, $content, $contentType);
        return $this->getSignedUrl($path, $expiresInSeconds);
    }

    /**
     * El emulador de Storage no tolera el cuerpo multipart que arma el cliente
     * de Google Cloud (se cae al parsearlo). La subida simple "media" sí funciona.
     */
    private function emulatorUpload(string $path, string $content, string $contentType): void
    {
        $url = 'http://' . $this->emulatorHost . '/upload/storage/v1/b/' . rawurlencode($this->bucket)
            . '/o?uploadType=media&name=' . rawurlencode($path);

        $response = \Config\Services::curlrequest()->post($url, [
            'headers'     => ['Content-Type' => $contentType],
            'body'        => $content,
            'http_errors' => false,
        ]);
        if ($response->getStatusCode() >= 300) {
            throw new \RuntimeException("El emulador de Storage rechazó la subida de {$path}: HTTP {$response->getStatusCode()}.");
        }
    }

    /**
     * El emulador no firma URLs (no hay clave privada). En su lugar se usa una
     * URL con token de descarga de Firebase, que también salta las reglas pero
     * solo para quien conoce el token. Solo se usa en desarrollo local.
     */
    private function emulatorDownloadUrl(string $path): string
    {
        $base = 'http://' . $this->emulatorHost . '/v0/b/' . rawurlencode($this->bucket)
            . '/o/' . rawurlencode($path);

        // Leer metadatos como "owner" hace que el emulador genere el token si falta.
        $response = \Config\Services::curlrequest()->get($base, [
            'headers'     => ['Authorization' => 'Bearer owner'],
            'http_errors' => false,
        ]);
        $meta  = json_decode($response->getBody(), true);
        $token = is_array($meta) ? explode(',', (string) ($meta['downloadTokens'] ?? ''))[0] : '';
        if ($token === '') {
            throw new \RuntimeException("No se pudo obtener el token de descarga del emulador para {$path}.");
        }

        return $base . '?alt=media&token=' . rawurlencode($token);
    }
}
