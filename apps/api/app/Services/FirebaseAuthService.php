<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UserModel;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Factory;

/**
 * Verificación del Firebase ID token + aprovisionamiento del usuario local (ADR-008).
 *
 * Usa el Admin SDK de Firebase (kreait/firebase-php) para verificar el ID token
 * (firma RS256 con claves públicas de Google, exp, aud=projectId, iss). Con el
 * firebase_uid resuelve el usuario local; si no existe, lo crea (Just-In-Time)
 * tomando nombre/email del token. CI4 no emite ni almacena tokens de sesión.
 */
final class FirebaseAuthService
{
    private FirebaseAuth $firebaseAuth;

    public function __construct(
        private readonly UserModel $users = new UserModel(),
    ) {
        $credentials = env('FIREBASE_CREDENTIALS', '');
        if ($credentials === '' || ! file_exists($credentials)) {
            throw new \RuntimeException('FIREBASE_CREDENTIALS no configurado o archivo inexistente.');
        }

        $this->firebaseAuth = (new Factory())
            ->withServiceAccount($credentials)
            ->createAuth();
    }

    /**
     * Verifica el ID token y devuelve el usuario local (creándolo si es nuevo).
     *
     * @return array<string,mixed>|null
     */
    public function verificarYResolver(string $idToken, bool $checkRevoked = false): ?array
    {
        $claims = $this->verifyIdToken($idToken, $checkRevoked);

        $uid   = (string) $claims['uid'];
        $email = (string) ($claims['email'] ?? '');
        $nombre = (string) ($claims['name'] ?? ($email !== '' ? explode('@', $email)[0] : 'Usuario'));
        $emailVerificado = (bool) ($claims['email_verified'] ?? false);

        $user = $this->users->porFirebaseUid($uid);
        if ($user === null) {
            $id = $this->users->aprovisionar($uid, $nombre, $email, $emailVerificado);
            $user = $this->users->find($id);
        }
        if ($user === null) {
            return null;
        }

        $user['roles'] = $this->users->rolesDe((int) $user['id']);
        return $user;
    }

    /**
     * Verifica el ID token con el Admin SDK y devuelve sus claims.
     *
     * @return array{uid:string, email?:string, email_verified?:bool, name?:string}
     */
    public function verifyIdToken(string $idToken, bool $checkRevoked = false): array
    {
        $verifiedToken = $checkRevoked
            ? $this->firebaseAuth->verifyIdToken($idToken, true)
            : $this->firebaseAuth->verifyIdToken($idToken);

        $claims = $verifiedToken->claims();

        return [
            'uid'            => $claims->get('sub'),
            'email'          => $claims->get('email'),
            'email_verified' => $claims->get('email_verified', false),
            'name'           => $claims->get('name', ''),
        ];
    }

    /** Fuerza cierre de sesión global (p. ej. al suspender una cuenta). */
    public function revocarSesiones(string $firebaseUid): void
    {
        $this->firebaseAuth->revokeRefreshTokens($firebaseUid);
    }
}
