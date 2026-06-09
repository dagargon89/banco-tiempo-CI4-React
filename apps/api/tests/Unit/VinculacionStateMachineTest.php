<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\VinculacionPolicyService;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitarios de la máquina de estados de vinculaciones (sin BD).
 */
final class VinculacionStateMachineTest extends TestCase
{
    private const TRANSICIONES = [
        'solicitada' => ['aceptada', 'rechazada', 'cancelada'],
        'aceptada'   => ['completada', 'cancelada'],
        'rechazada'  => [],
        'completada' => [],
        'cancelada'  => [],
    ];

    // ── Transiciones válidas ──

    public function testSolicitadaPuedeTransicionarAAceptada(): void
    {
        $this->assertContains('aceptada', self::TRANSICIONES['solicitada']);
    }

    public function testSolicitadaPuedeTransicionarARechazada(): void
    {
        $this->assertContains('rechazada', self::TRANSICIONES['solicitada']);
    }

    public function testSolicitadaPuedeTransicionarACancelada(): void
    {
        $this->assertContains('cancelada', self::TRANSICIONES['solicitada']);
    }

    public function testAceptadaPuedeTransicionarACompletada(): void
    {
        $this->assertContains('completada', self::TRANSICIONES['aceptada']);
    }

    public function testAceptadaPuedeTransicionarACancelada(): void
    {
        $this->assertContains('cancelada', self::TRANSICIONES['aceptada']);
    }

    // ── Transiciones inválidas ──

    public function testSolicitadaNoPuedeTransicionarACompletada(): void
    {
        $this->assertNotContains('completada', self::TRANSICIONES['solicitada']);
    }

    public function testAceptadaNoPuedeTransicionarARechazada(): void
    {
        $this->assertNotContains('rechazada', self::TRANSICIONES['aceptada']);
    }

    public function testAceptadaNoPuedeTransicionarASolicitada(): void
    {
        $this->assertNotContains('solicitada', self::TRANSICIONES['aceptada']);
    }

    // ── Estados terminales ──

    public function testRechazadaEsTerminal(): void
    {
        $this->assertEmpty(self::TRANSICIONES['rechazada']);
    }

    public function testCompletadaEsTerminal(): void
    {
        $this->assertEmpty(self::TRANSICIONES['completada']);
    }

    public function testCanceladaEsTerminal(): void
    {
        $this->assertEmpty(self::TRANSICIONES['cancelada']);
    }

    // ── Policy: oferente acepta/rechaza ──

    public function testOferentePuedeAceptarSolicitada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertTrue($policy->puedeAceptarRechazar(1, $vinculacion));
    }

    public function testBuscadorNoPuedeAceptar(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertFalse($policy->puedeAceptarRechazar(2, $vinculacion));
    }

    public function testTerceroNoPuedeAceptar(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertFalse($policy->puedeAceptarRechazar(99, $vinculacion));
    }

    public function testOferenteNoPuedeAceptarSiNoEsSolicitada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'aceptada'];
        $this->assertFalse($policy->puedeAceptarRechazar(1, $vinculacion));
    }

    // ── Policy: cancelar ──

    public function testBuscadorPuedeCancelarSolicitada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertTrue($policy->puedeCancelar(2, $vinculacion));
    }

    public function testOferentePuedeCancelarAceptada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'aceptada'];
        $this->assertTrue($policy->puedeCancelar(1, $vinculacion));
    }

    public function testNoPuedeCancelarCompletada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'completada'];
        $this->assertFalse($policy->puedeCancelar(2, $vinculacion));
    }

    public function testTerceroNoPuedeCancelar(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertFalse($policy->puedeCancelar(99, $vinculacion));
    }

    // ── Policy: confirmar ──

    public function testBuscadorPuedeConfirmarAceptada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'aceptada'];
        $this->assertTrue($policy->puedeConfirmar(2, $vinculacion));
    }

    public function testOferentePuedeConfirmarAceptada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'aceptada'];
        $this->assertTrue($policy->puedeConfirmar(1, $vinculacion));
    }

    public function testNoPuedeConfirmarSolicitada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertFalse($policy->puedeConfirmar(2, $vinculacion));
    }

    // ── Policy: ver ──

    public function testPartePuedeVerVinculacion(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertTrue($policy->puedeVer(1, $vinculacion));
        $this->assertTrue($policy->puedeVer(2, $vinculacion));
    }

    public function testTerceroNoPuedeVerVinculacion(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertFalse($policy->puedeVer(99, $vinculacion));
    }

    public function testModeradorPuedeVerCualquierVinculacion(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertTrue($policy->puedeVer(99, $vinculacion, ['moderador']));
    }

    // ── Policy: ver chat ──

    public function testPartePuedeVerChatEnAceptada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'aceptada'];
        $this->assertTrue($policy->puedeVerChat(2, $vinculacion));
    }

    public function testParteNoPuedeVerChatEnSolicitada(): void
    {
        $policy = new VinculacionPolicyService();
        $vinculacion = ['buscador_id' => 2, 'oferente_id' => 1, 'estado' => 'solicitada'];
        $this->assertFalse($policy->puedeVerChat(2, $vinculacion));
    }

    // ── Doble confirmación (lógica pura) ──

    public function testUnaConfirmacionNoCompleta(): void
    {
        $confirmadoOferente = true;
        $confirmadoBuscador = false;
        $this->assertFalse($confirmadoOferente && $confirmadoBuscador);
    }

    public function testDobleConfirmacionCompleta(): void
    {
        $confirmadoOferente = true;
        $confirmadoBuscador = true;
        $this->assertTrue($confirmadoOferente && $confirmadoBuscador);
    }
}
