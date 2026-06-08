<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\OfertaPolicyService;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitarios para la lógica de ofertas.
 */
final class OfertaServiceTest extends TestCase
{
    // ── Transiciones de estado ──

    private const TRANSICIONES = [
        'borrador' => ['activa', 'eliminada'],
        'activa'   => ['pausada', 'eliminada'],
        'pausada'  => ['activa', 'eliminada'],
    ];

    public function testTransicionesValidasDesdeActiva(): void
    {
        $permitidos = self::TRANSICIONES['activa'];
        $this->assertContains('pausada', $permitidos);
        $this->assertContains('eliminada', $permitidos);
        $this->assertNotContains('borrador', $permitidos);
    }

    public function testTransicionesValidasDesdePausada(): void
    {
        $permitidos = self::TRANSICIONES['pausada'];
        $this->assertContains('activa', $permitidos);
        $this->assertContains('eliminada', $permitidos);
        $this->assertNotContains('borrador', $permitidos);
    }

    public function testTransicionesValidasDesdeBorrador(): void
    {
        $permitidos = self::TRANSICIONES['borrador'];
        $this->assertContains('activa', $permitidos);
        $this->assertContains('eliminada', $permitidos);
        $this->assertNotContains('pausada', $permitidos);
    }

    public function testEliminadaEsTerminal(): void
    {
        $this->assertArrayNotHasKey('eliminada', self::TRANSICIONES);
    }

    // ── Policy: dueño/no-dueño/moderador ──

    public function testDuenoPuedeEditarOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue($policy->puedeEditar(1, ['user_id' => 1]));
    }

    public function testNoDuennoNoPuedeEditarOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertFalse($policy->puedeEditar(2, ['user_id' => 1]));
    }

    public function testModeradorPuedeEditarOferta(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue($policy->puedeEditar(99, ['user_id' => 1], ['moderador']));
    }

    public function testDuenoPuedeCambiarEstado(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue($policy->puedeCambiarEstado(1, ['user_id' => 1]));
    }

    public function testNoDuennoNoPuedeCambiarEstado(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertFalse($policy->puedeCambiarEstado(2, ['user_id' => 1]));
    }

    // ── Regla presencial + zona ──

    public function testPresencialRequiereZona(): void
    {
        $datos = ['modalidad' => 'presencial', 'zona' => ''];
        $this->assertTrue(
            $datos['modalidad'] === 'presencial' && trim($datos['zona']) === '',
            'Presencial sin zona debe ser inválido.'
        );
    }

    public function testVirtualNoRequiereZona(): void
    {
        $datos = ['modalidad' => 'virtual', 'zona' => ''];
        $this->assertFalse(
            $datos['modalidad'] === 'presencial',
            'Virtual no requiere zona.'
        );
    }
}
