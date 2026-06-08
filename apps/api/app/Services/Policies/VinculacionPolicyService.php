<?php

declare(strict_types=1);

namespace App\Services\Policies;

/**
 * Autorización a nivel de objeto para vinculaciones (doc 04 A01).
 */
final class VinculacionPolicyService extends BasePolicyService
{
    /** Solo las partes de la vinculación pueden verla. */
    public function puedeVer(int $userId, array $vinculacion, array $roles = []): bool
    {
        if ($this->esModerador($roles)) {
            return true;
        }
        return $this->esParte($userId, $vinculacion);
    }

    /** Solo las partes pueden ver el chat, y solo en estado aceptada/completada. */
    public function puedeVerChat(int $userId, array $vinculacion, array $roles = []): bool
    {
        if ($this->esModerador($roles)) {
            return true;
        }
        return $this->esParte($userId, $vinculacion)
            && in_array($vinculacion['estado'], ['aceptada', 'completada'], true);
    }

    /** Solo el oferente puede aceptar/rechazar una vinculación solicitada. */
    public function puedeAceptarRechazar(int $userId, array $vinculacion): bool
    {
        return $userId === (int) $vinculacion['oferente_id']
            && $vinculacion['estado'] === 'solicitada';
    }

    /** Solo las partes pueden cancelar, y solo en estado solicitada/aceptada. */
    public function puedeCancelar(int $userId, array $vinculacion): bool
    {
        return $this->esParte($userId, $vinculacion)
            && in_array($vinculacion['estado'], ['solicitada', 'aceptada'], true);
    }

    /** Cada parte confirma completar; solo en estado aceptada. */
    public function puedeConfirmar(int $userId, array $vinculacion): bool
    {
        return $this->esParte($userId, $vinculacion)
            && $vinculacion['estado'] === 'aceptada';
    }

    private function esParte(int $userId, array $vinculacion): bool
    {
        return $userId === (int) ($vinculacion['buscador_id'] ?? 0)
            || $userId === (int) ($vinculacion['oferente_id'] ?? 0);
    }
}
