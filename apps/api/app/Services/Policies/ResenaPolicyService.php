<?php

declare(strict_types=1);

namespace App\Services\Policies;

/**
 * Autorización a nivel de objeto para reseñas (doc 04 A01).
 */
final class ResenaPolicyService extends BasePolicyService
{
    /** Solo las partes de una vinculación completada pueden crear reseña. */
    public function puedeCrear(int $userId, array $vinculacion): bool
    {
        return $this->esParte($userId, $vinculacion)
            && $vinculacion['estado'] === 'completada';
    }

    /** Solo se puede reportar una reseña ajena. */
    public function puedeReportar(int $userId, array $resena): bool
    {
        return $userId !== (int) $resena['autor_id'];
    }

    /** Solo moderadores/super_admin pueden ocultar reseñas. */
    public function puedeOcultar(array $roles): bool
    {
        return $this->esModerador($roles);
    }

    private function esParte(int $userId, array $vinculacion): bool
    {
        return $userId === (int) ($vinculacion['buscador_id'] ?? 0)
            || $userId === (int) ($vinculacion['oferente_id'] ?? 0);
    }
}
