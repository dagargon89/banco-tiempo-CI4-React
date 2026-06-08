<?php

declare(strict_types=1);

namespace App\Services;

use Kreait\Firebase\Factory;

final class FirebaseStorageService
{
    private \Google\Cloud\Storage\StorageClient $storage;
    private string $bucket;

    public function __construct()
    {
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
}
