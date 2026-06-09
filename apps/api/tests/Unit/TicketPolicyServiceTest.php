<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\TicketPolicyService;
use PHPUnit\Framework\TestCase;

final class TicketPolicyServiceTest extends TestCase
{
    private TicketPolicyService $policy;

    protected function setUp(): void
    {
        $this->policy = new TicketPolicyService();
    }

    // ── puedeCrear ──

    public function testPuedeCrearSiempreTrue(): void
    {
        $this->assertTrue($this->policy->puedeCrear());
    }

    // ── puedeAsignar ──

    public function testModeradorPuedeAsignar(): void
    {
        $this->assertTrue($this->policy->puedeAsignar(['moderador']));
    }

    public function testSuperAdminPuedeAsignar(): void
    {
        $this->assertTrue($this->policy->puedeAsignar(['super_admin']));
    }

    public function testUsuarioRegularNoPuedeAsignar(): void
    {
        $this->assertFalse($this->policy->puedeAsignar([]));
    }

    public function testSinRolesNoPuedeAsignar(): void
    {
        $this->assertFalse($this->policy->puedeAsignar(['usuario']));
    }

    // ── puedeCambiarEstado ──

    public function testModeradorPuedeCambiarEstado(): void
    {
        $this->assertTrue($this->policy->puedeCambiarEstado(['moderador']));
    }

    public function testSuperAdminPuedeCambiarEstado(): void
    {
        $this->assertTrue($this->policy->puedeCambiarEstado(['super_admin']));
    }

    public function testUsuarioRegularNoPuedeCambiarEstado(): void
    {
        $this->assertFalse($this->policy->puedeCambiarEstado([]));
    }

    public function testSinRolesNoPuedeCambiarEstado(): void
    {
        $this->assertFalse($this->policy->puedeCambiarEstado(['usuario']));
    }
}
