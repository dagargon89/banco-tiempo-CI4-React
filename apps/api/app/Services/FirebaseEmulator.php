<?php

declare(strict_types=1);

namespace App\Services;

use Google\Auth\FetchAuthTokenInterface;
use Kreait\Firebase\Factory;

/**
 * Soporte para Firebase Emulator Suite en desarrollo local.
 *
 * Se activa definiendo FIREBASE_AUTH_EMULATOR_HOST (y opcionalmente
 * FIREBASE_STORAGE_EMULATOR_HOST) en el .env. En ese modo kreait acepta
 * ID tokens SIN firma emitidos por el emulador, así que jamás debe activarse
 * en producción: si se detecta ahí, se lanza una excepción (deny-by-default).
 *
 * No requiere cuenta de servicio: basta con FIREBASE_PROJECT_ID, que debe
 * coincidir con el --project del emulador (usar el prefijo `demo-`).
 */
final class FirebaseEmulator
{
    /** Emisor que el emulador de Auth espera en custom tokens sin firma. */
    private const EMULATOR_SERVICE_ACCOUNT = 'firebase-auth-emulator@example.com';

    private const CUSTOM_TOKEN_AUDIENCE = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';

    public static function authHost(): ?string
    {
        return self::host('FIREBASE_AUTH_EMULATOR_HOST');
    }

    public static function storageHost(): ?string
    {
        return self::host('FIREBASE_STORAGE_EMULATOR_HOST');
    }

    public static function projectId(): string
    {
        $projectId = trim((string) env('FIREBASE_PROJECT_ID', ''));
        if ($projectId === '') {
            throw new \RuntimeException('FIREBASE_PROJECT_ID es obligatorio con el emulador de Firebase.');
        }

        return $projectId;
    }

    /**
     * Factory de kreait apuntando al emulador, sin cuenta de servicio.
     *
     * kreait exige credenciales para su cliente HTTP aunque use el emulador, y
     * no expone un setter público. Se inyecta un proveedor que devuelve el
     * token "owner", que el emulador trata como Admin SDK.
     */
    public static function factory(): Factory
    {
        $factory = (new Factory())->withProjectId(self::projectId());

        $owner = new class () implements FetchAuthTokenInterface {
            /** @return array{access_token:string} */
            public function fetchAuthToken(?callable $httpHandler = null): array
            {
                return ['access_token' => 'owner'];
            }

            public function getCacheKey(): string
            {
                return 'firebase-emulator-owner';
            }

            /** @return array{access_token:string} */
            public function getLastReceivedToken(): array
            {
                return ['access_token' => 'owner'];
            }
        };

        \Closure::bind(static function (Factory $f) use ($owner): void {
            $f->googleAuthTokenCredentials = $owner;
        }, null, Factory::class)($factory);

        return $factory;
    }

    /**
     * Custom token sin firma (alg "none") que el emulador de Auth acepta en
     * signInWithCustomToken. Mismo formato que usa el Admin SDK oficial.
     *
     * @param array<string,mixed> $claims
     */
    public static function customToken(string $uid, array $claims = [], int $ttl = 3600): string
    {
        $now = time();
        $header  = ['alg' => 'none', 'typ' => 'JWT'];
        $payload = [
            'iss' => self::EMULATOR_SERVICE_ACCOUNT,
            'sub' => self::EMULATOR_SERVICE_ACCOUNT,
            'aud' => self::CUSTOM_TOKEN_AUDIENCE,
            'iat' => $now,
            'exp' => $now + $ttl,
            'uid' => $uid,
        ];
        if ($claims !== []) {
            $payload['claims'] = $claims;
        }

        return self::base64Url((string) json_encode($header)) . '.'
            . self::base64Url((string) json_encode($payload)) . '.';
    }

    private static function host(string $name): ?string
    {
        $value = trim((string) env($name, ''));
        if ($value === '') {
            return null;
        }

        if (ENVIRONMENT === 'production') {
            throw new \RuntimeException("{$name} está definido en producción. Los emuladores de Firebase solo se permiten en desarrollo.");
        }

        return $value;
    }

    private static function base64Url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
