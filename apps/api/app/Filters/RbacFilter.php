<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * RBAC de ruta (doc 04 A01, menor privilegio). Tras auth-firebase.
 * Uso: ['filter' => 'rbac:moderador'] o 'rbac:super_admin'.
 * super_admin satisface cualquier requisito de moderador.
 */
final class RbacFilter implements FilterInterface
{
    private const HIERARCHY = [
        'super_admin' => ['super_admin', 'moderador'],
        'moderador'   => ['moderador'],
    ];

    public function before(RequestInterface $request, $arguments = null)
    {
        $required = $arguments[0] ?? null;
        if ($required === null) {
            return service('response')->setStatusCode(500)
                ->setJSON(['message' => 'Filtro RBAC mal configurado.']);
        }

        $roles = array_filter(explode(',', $request->getHeaderLine('X-Auth-Roles')));
        $granted = [];
        foreach ($roles as $role) {
            $granted = array_merge($granted, self::HIERARCHY[$role] ?? []);
        }
        if (! in_array($required, $granted, true)) {
            return service('response')->setStatusCode(403)
                ->setJSON(['message' => 'No tienes permiso para esta acción.']);
        }

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
