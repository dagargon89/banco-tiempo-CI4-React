<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\DocumentoPolicyService;
use App\Services\Policies\OfertaPolicyService;
use App\Services\Policies\VinculacionPolicyService;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitarios para PolicyServices (doc 04 A01).
 * Verifican autorización a nivel de objeto con denegación por defecto.
 */
final class PolicyServiceTest extends TestCase
{
    // ── OfertaPolicyService ──

    public function testDueñoPuedeEditarSuOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue($policy->puedeEditar(1, ['user_id' => 1]));
    }

    public function testOtroUsuarioNoPuedeEditarOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertFalse($policy->puedeEditar(2, ['user_id' => 1]));
    }

    public function testModeradorPuedeEditarCualquierOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue($policy->puedeEditar(99, ['user_id' => 1], ['moderador']));
    }

    public function testSuperAdminPuedeEditarCualquierOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue($policy->puedeEditar(99, ['user_id' => 1], ['super_admin']));
    }

    // ── VinculacionPolicyService ──

    public function testPartesPuedenVerVinculacion(): void
    {
        $policy = new VinculacionPolicyService();
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'aceptada'];
        $this->assertTrue($policy->puedeVer(1, $vinc));
        $this->assertTrue($policy->puedeVer(2, $vinc));
    }

    public function testTerceroNoPuedeVerVinculacion(): void
    {
        $policy = new VinculacionPolicyService();
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'aceptada'];
        $this->assertFalse($policy->puedeVer(99, $vinc));
    }

    public function testChatSoloEnEstadoAceptadaOCompletada(): void
    {
        $policy = new VinculacionPolicyService();
        $base = ['buscador_id' => 1, 'oferente_id' => 2];

        $this->assertTrue($policy->puedeVerChat(1, [...$base, 'estado' => 'aceptada']));
        $this->assertTrue($policy->puedeVerChat(1, [...$base, 'estado' => 'completada']));
        $this->assertFalse($policy->puedeVerChat(1, [...$base, 'estado' => 'solicitada']));
        $this->assertFalse($policy->puedeVerChat(1, [...$base, 'estado' => 'rechazada']));
        $this->assertFalse($policy->puedeVerChat(1, [...$base, 'estado' => 'cancelada']));
    }

    public function testSoloOferentePuedeAceptar(): void
    {
        $policy = new VinculacionPolicyService();
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'solicitada'];

        $this->assertTrue($policy->puedeAceptarRechazar(2, $vinc));
        $this->assertFalse($policy->puedeAceptarRechazar(1, $vinc));
    }

    public function testNoPuedeAceptarSiNoEstaSolicitada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'aceptada'];
        $this->assertFalse($policy->puedeAceptarRechazar(2, $vinc));
    }

    public function testCancelarSoloEnSolicitadaOAceptada(): void
    {
        $policy = new VinculacionPolicyService();
        $base = ['buscador_id' => 1, 'oferente_id' => 2];

        $this->assertTrue($policy->puedeCancelar(1, [...$base, 'estado' => 'solicitada']));
        $this->assertTrue($policy->puedeCancelar(2, [...$base, 'estado' => 'aceptada']));
        $this->assertFalse($policy->puedeCancelar(1, [...$base, 'estado' => 'completada']));
    }

    public function testConfirmarSoloEnAceptada(): void
    {
        $policy = new VinculacionPolicyService();
        $base = ['buscador_id' => 1, 'oferente_id' => 2];

        $this->assertTrue($policy->puedeConfirmar(1, [...$base, 'estado' => 'aceptada']));
        $this->assertFalse($policy->puedeConfirmar(1, [...$base, 'estado' => 'solicitada']));
    }

    // ── DocumentoPolicyService ──

    public function testSoloDueñoPuedeSubirDocumento(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertTrue($policy->puedeSubir(1, 1));
        $this->assertFalse($policy->puedeSubir(2, 1));
    }

    public function testSoloModeradorPuedeRevisarDocumento(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertTrue($policy->puedeRevisar(['moderador']));
        $this->assertTrue($policy->puedeRevisar(['super_admin']));
        $this->assertFalse($policy->puedeRevisar([]));
    }

    public function testModeradorPuedeVerChatDeOtros(): void
    {
        $policy = new VinculacionPolicyService();
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'aceptada'];
        $this->assertTrue($policy->puedeVerChat(99, $vinc, ['moderador']));
    }
}
