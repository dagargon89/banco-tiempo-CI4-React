<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests HTTP para endpoints de reseñas.
 * Verifica guards de autenticación (sin bypass de Firebase).
 */
final class ResenasEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── 401 en endpoints protegidos sin auth ──

    public function testCrearResenaSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/vinculaciones/1/resena');
        $result->assertStatus(401);
    }

    public function testReportarResenaSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/resenas/1/reportar');
        $result->assertStatus(401);
    }

    // ── Endpoints públicos no requieren auth ──

    public function testResenasPublicasNoRequierenAuth(): void
    {
        $result = $this->get('api/v1/usuarios/1/resenas');
        // No debe ser 401 (puede ser 200 con array vacío)
        $this->assertNotEquals(401, $result->response()->getStatusCode());
    }

    // ── Admin endpoints ──

    public function testOcultarResenaSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/admin/resenas/1/ocultar');
        $result->assertStatus(401);
    }
}
