<?php

declare(strict_types=1);

namespace App\Services\Policies;

final class TicketPolicyService extends BasePolicyService
{
    public function puedeCrear(): bool
    {
        return true;
    }

    public function puedeAsignar(array $roles): bool
    {
        return $this->esModerador($roles);
    }

    public function puedeCambiarEstado(array $roles): bool
    {
        return $this->esModerador($roles);
    }
}
