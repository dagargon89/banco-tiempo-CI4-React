<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Perfil del usuario autenticado (GET/PATCH /api/v1/me).
 */
final class Me extends Controller
{
    use ApiResponder;

    public function show(): ResponseInterface
    {
        $users  = model(\App\Models\UserModel::class);
        $u      = $users->find((int) $this->request->userId);

        if ($u === null) {
            return $this->notFound('Usuario no encontrado.');
        }

        return $this->ok([
            'id'                  => (int) $u['id'],
            'nombre'              => $u['nombre'],
            'email'               => $u['email'],
            'bio'                 => $u['bio'] ?? '',
            'foto_perfil'         => $u['foto_perfil'] ?? null,
            'email_verificado'    => $u['email_verified_at'] !== null,
            'estado_verificacion' => $u['estado_verificacion'],
            'estado_cuenta'       => $u['estado_cuenta'],
            'roles'               => $this->request->roles ?? [],
            'created_at'          => $u['created_at'],
        ]);
    }

    public function update(): ResponseInterface
    {
        $users  = model(\App\Models\UserModel::class);
        $userId = (int) $this->request->userId;

        $data = $this->request->getJSON(true) ?? [];
        $allowed = array_intersect_key($data, array_flip(['nombre', 'bio', 'foto_perfil']));

        if ($allowed === []) {
            return $this->fail('No hay campos válidos para actualizar.');
        }

        if (! $users->update($userId, $allowed)) {
            return $this->unprocessable($users->errors());
        }

        return $this->show();
    }
}
