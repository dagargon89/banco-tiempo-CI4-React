<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Autenticación por Firebase ID token (ADR-008, doc 04 A01/A07).
 *
 * Extrae el Bearer token, lo verifica con el Admin SDK de Firebase
 * (firma RS256, exp, aud=projectId, iss), resuelve el firebase_uid al
 * usuario local de MySQL (aprovisionamiento JIT) y deja en el request
 * userId, roles y verif para autorización aguas abajo. Deniega por defecto.
 */
final class AuthFirebaseFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $header = $request->getHeaderLine('Authorization');
        if (! str_starts_with($header, 'Bearer ')) {
            return $this->deny('Token de acceso ausente.');
        }
        $idToken = trim(substr($header, 7));

        try {
            // FirebaseAuthService encapsula verifyIdToken + mapeo a usuario local.
            $usuario = service('firebaseAuth')->verificarYResolver($idToken);
        } catch (\Throwable) {
            return $this->deny('Token de acceso inválido o expirado.');
        }

        if ($usuario === null) {
            return $this->deny('Usuario no autorizado.');
        }
        if (($usuario['estado_cuenta'] ?? 'activa') !== 'activa') {
            return service('response')->setStatusCode(403)
                ->setJSON(['message' => 'Cuenta no activa.']);
        }

        $request->userId = (int) $usuario['id'];
        $request->roles  = $usuario['roles'] ?? [];
        $request->verif  = (string) ($usuario['estado_verificacion'] ?? 'no_verificado');

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }

    private function deny(string $message): ResponseInterface
    {
        return service('response')->setStatusCode(401)->setJSON(['message' => $message]);
    }
}
