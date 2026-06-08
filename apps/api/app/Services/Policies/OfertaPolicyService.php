<?php

declare(strict_types=1);

namespace App\Services\Policies;

/**
 * Autorización a nivel de objeto para ofertas (doc 04 A01).
 */
final class OfertaPolicyService extends BasePolicyService
{
    /** Solo el dueño puede editar su oferta. */
    public function puedeEditar(int $userId, array $oferta, array $roles = []): bool
    {
        if ($this->esModerador($roles)) {
            return true;
        }
        return $userId === (int) $oferta['user_id'];
    }

    /** Solo el dueño puede cambiar el estado de su oferta. */
    public function puedeCambiarEstado(int $userId, array $oferta, array $roles = []): bool
    {
        if ($this->esModerador($roles)) {
            return true;
        }
        return $userId === (int) $oferta['user_id'];
    }
}
