<?php

declare(strict_types=1);

namespace App\Services\Policies;

/**
 * PolicyService base (doc 04 A01). Denegación por defecto.
 *
 * Cada PolicyService autoriza a nivel de objeto, no solo de ruta.
 * El filtro rbac: corta por rol; el PolicyService verifica propiedad
 * del recurso concreto (ej. oferta.user_id === userId).
 */
abstract class BasePolicyService
{
    /** Verifica si el usuario tiene uno de los roles dados. */
    protected function tieneRol(array $roles, string ...$required): bool
    {
        foreach ($required as $r) {
            if (in_array($r, $roles, true)) {
                return true;
            }
        }
        return false;
    }

    /** Moderadores y super_admin pueden acceder a cualquier recurso de su ámbito. */
    protected function esModerador(array $roles): bool
    {
        return $this->tieneRol($roles, 'moderador', 'super_admin');
    }
}
