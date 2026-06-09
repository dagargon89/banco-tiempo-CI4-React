<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\ResenaPolicyService;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitarios para ResenaPolicyService.
 * Verifican autorización a nivel de objeto para reseñas.
 */
final class ResenaPolicyServiceTest extends TestCase
{
    private ResenaPolicyService $policy;

    protected function setUp(): void
    {
        $this->policy = new ResenaPolicyService();
    }

    // ── puedeCrear ──

    public function testParteEnCompletadaPuedeCrear(): void
    {
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'completada'];
        $this->assertTrue($this->policy->puedeCrear(1, $vinc));
        $this->assertTrue($this->policy->puedeCrear(2, $vinc));
    }

    public function testNoPartNoPuedeCrear(): void
    {
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'completada'];
        $this->assertFalse($this->policy->puedeCrear(99, $vinc));
    }

    public function testEstadoNoCompletadaNoPuedeCrear(): void
    {
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'aceptada'];
        $this->assertFalse($this->policy->puedeCrear(1, $vinc));
    }

    public function testEstadoSolicitadaNoPuedeCrear(): void
    {
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'solicitada'];
        $this->assertFalse($this->policy->puedeCrear(1, $vinc));
    }

    public function testEstadoRechazadaNoPuedeCrear(): void
    {
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'rechazada'];
        $this->assertFalse($this->policy->puedeCrear(1, $vinc));
    }

    public function testEstadoCanceladaNoPuedeCrear(): void
    {
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'cancelada'];
        $this->assertFalse($this->policy->puedeCrear(1, $vinc));
    }

    // ── puedeReportar ──

    public function testOtroUsuarioPuedeReportar(): void
    {
        $resena = ['autor_id' => 1];
        $this->assertTrue($this->policy->puedeReportar(2, $resena));
    }

    public function testAutorNoPuedeReportar(): void
    {
        $resena = ['autor_id' => 1];
        $this->assertFalse($this->policy->puedeReportar(1, $resena));
    }

    // ── puedeOcultar ──

    public function testModeradorPuedeOcultar(): void
    {
        $this->assertTrue($this->policy->puedeOcultar(['moderador']));
    }

    public function testSuperAdminPuedeOcultar(): void
    {
        $this->assertTrue($this->policy->puedeOcultar(['super_admin']));
    }

    public function testUsuarioRegularNoPuedeOcultar(): void
    {
        $this->assertFalse($this->policy->puedeOcultar([]));
        $this->assertFalse($this->policy->puedeOcultar(['usuario']));
    }
}
