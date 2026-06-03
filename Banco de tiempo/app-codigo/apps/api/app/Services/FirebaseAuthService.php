<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\UserModel;

/**
 * Verificación del Firebase ID token + aprovisionamiento del usuario local (ADR-008).
 *
 * Usa el Admin SDK de Firebase (kreait/firebase-php) para verificar el ID token
 * (firma RS256 con claves públicas de Google, exp, aud=projectId, iss). Con el
 * firebase_uid resuelve el usuario local; si no existe, lo crea (Just-In-Time)
 * tomando nombre/email del token. CI4 no emite ni almacena tokens de sesión.
 *
 * NOTA: la inicialización del SDK (Factory con FIREBASE_CREDENTIALS) se completa
 * en Sprint 1. Aquí queda el contrato y el mapeo a MySQL.
 */
final class FirebaseAuthService
{
    public function __construct(
        private readonly UserModel $users = new UserModel(),
    ) {
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
     * @return array{uid:string, email?:string, email_verified?:bool, name?:string, firebase?:array}
     */
    public function verifyIdToken(string $idToken, bool $checkRevoked = false): array
    {
        // Implementación con kreait/firebase-php (Sprint 1):
        //   $auth = (new Factory)->withServiceAccount(env('FIREBASE_CREDENTIALS'))->createAuth();
        //   $verified = $auth->verifyIdToken($idToken, $checkRevoked);
        //   return ['uid' => $verified->claims()->get('sub'), 'email' => ..., ...];
        // Hasta entonces, este método debe lanzar para no autorizar por accidente.
        throw new \RuntimeException('FirebaseAuthService::verifyIdToken pendiente de implementar (Sprint 1).');
    }

    /** Fuerza cierre de sesión global (p. ej. al suspender una cuenta). */
    public function revocarSesiones(string $firebaseUid): void
    {
        // $auth->revokeRefreshTokens($firebaseUid);  // Admin SDK (Sprint 1)
    }
}
