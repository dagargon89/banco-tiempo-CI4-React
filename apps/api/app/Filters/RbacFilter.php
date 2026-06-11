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
        // CodeIgniter parsea `rbac:moderador,verificador` como múltiples
        // argumentos (split por coma). Tomamos todos como roles válidos.
        // También aceptamos un solo argumento con comas para compatibilidad
        // hacia atrás (`rbac:'moderador,verificador'`).
        $required = [];
        if (is_array($arguments)) {
            foreach ($arguments as $arg) {
                foreach (explode(',', (string) $arg) as $r) {
                    $r = trim($r);
                    if ($r !== '') {
                        $required[] = $r;
                    }
                }
            }
        }

        if ($required === []) {
            return service('response')->setStatusCode(500)
                ->setJSON(['message' => 'Filtro RBAC mal configurado.']);
        }

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
