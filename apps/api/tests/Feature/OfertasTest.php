<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests de feature para endpoints de ofertas (Sprint 3).
 * Solo se prueban guards de autenticación (sin DB de test).
 */
final class OfertasTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── 401 sin auth en endpoints protegidos ──

    public function testCrearOfertaSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/ofertas');
        $result->assertStatus(401);
    }

    public function testActualizarOfertaSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/ofertas/1');
        $result->assertStatus(401);
    }

    public function testCambiarEstadoOfertaSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/ofertas/1/estado');
        $result->assertStatus(401);
    }

    public function testMeOfertasSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/me/ofertas');
        $result->assertStatus(401);
    }

    // ── Admin: 401 sin auth ──

    public function testAdminOfertasSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/ofertas');
        $result->assertStatus(401);
    }

    public function testAdminDespublicarSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/admin/ofertas/1/despublicar');
        $result->assertStatus(401);
    }
}
