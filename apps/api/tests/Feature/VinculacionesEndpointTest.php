<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests HTTP para endpoints de vinculaciones.
 * Verifica guards de autenticación (sin bypass de Firebase).
 */
final class VinculacionesEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── 401 sin auth en todos los endpoints protegidos ──

    public function testMarcarInteresSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/ofertas/1/interes');
        $result->assertStatus(401);
    }

    public function testListarVinculacionesSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/vinculaciones');
        $result->assertStatus(401);
    }

    public function testVerVinculacionSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/vinculaciones/1');
        $result->assertStatus(401);
    }

    public function testAceptarSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/vinculaciones/1/aceptar');
        $result->assertStatus(401);
    }

    public function testRechazarSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/vinculaciones/1/rechazar');
        $result->assertStatus(401);
    }

    public function testCancelarSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/vinculaciones/1/cancelar');
        $result->assertStatus(401);
    }

    public function testConfirmarSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/vinculaciones/1/confirmar');
        $result->assertStatus(401);
    }

    public function testChatTokenSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/vinculaciones/1/chat/token');
        $result->assertStatus(401);
    }
}
