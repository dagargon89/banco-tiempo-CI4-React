<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Sincronización de sesión Firebase (doc 05 §2, ADR-008).
 *
 * El SPA inicia sesión con Firebase (email/contraseña, Google, Facebook, Microsoft)
 * y llama a este endpoint con el ID token en el header. El filtro `auth-firebase` ya
 * verificó el token y aprovisionó/resolvió el usuario local; aquí solo devolvemos su perfil.
 */
final class Auth extends Controller
{
    use ApiResponder;

    public function sync(): ResponseInterface
    {
        $userId = (int) $this->request->userId;
        $users  = model(\App\Models\UserModel::class);
        $u      = $users->find($userId);

        if ($u === null) {
            return $this->forbidden('Cuenta no disponible.');
        }

        return $this->ok([
            'id'                  => (int) $u['id'],
            'nombre'              => $u['nombre'],
            'email'               => $u['email'],
            'email_verificado'    => $u['email_verified_at'] !== null,
            'estado_verificacion' => $u['estado_verificacion'],
            'roles'               => $this->request->roles ?? [],
        ]);
    }
}
