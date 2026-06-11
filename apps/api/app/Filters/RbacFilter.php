<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * RBAC de ruta (doc 04 A01, menor privilegio). Tras auth-firebase.
 *
 * Acepta uno o varios roles separados por coma; el usuario satisface el
 * requisito si tiene CUALQUIERA de los roles listados. `super_admin` siempre
 * satisface cualquier requisito (override total).
 *
 * Ejemplos:
 *   ['filter' => 'rbac:moderador']                  → moderador o super_admin
 *   ['filter' => 'rbac:moderador,soporte']          → moderador, soporte o super_admin
 *   ['filter' => 'rbac:super_admin']                → solo super_admin
 */
final class RbacFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $raw = $arguments[0] ?? null;
        if ($raw === null) {
            return service('response')->setStatusCode(500)
                ->setJSON(['message' => 'Filtro RBAC mal configurado.']);
        }

        $required = array_filter(array_map('trim', explode(',', (string) $raw)));
        $userRoles = array_filter(array_map('trim', explode(',', $request->getHeaderLine('X-Auth-Roles'))));

        // super_admin satisface cualquier requisito.
        if (in_array('super_admin', $userRoles, true)) {
            return $request;
        }

        foreach ($userRoles as $role) {
            if (in_array($role, $required, true)) {
                return $request;
            }
        }

        return service('response')->setStatusCode(403)
            ->setJSON(['message' => 'No tienes permiso para esta acción.']);
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
