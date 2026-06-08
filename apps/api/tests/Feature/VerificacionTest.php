<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests de feature para endpoints de verificación (Sprint 2).
 */
final class VerificacionTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── 401 sin auth ──

    public function testRegistrarDocumentoSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/verificacion/documentos');
        $result->assertStatus(401);
    }

    public function testEstadoSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/verificacion/estado');
        $result->assertStatus(401);
    }

    // ── Admin: 401 sin auth ──

    public function testAdminVerificacionesSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/verificaciones');
        $result->assertStatus(401);
    }

    public function testAdminDocumentoSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/verificaciones/1/documento');
        $result->assertStatus(401);
    }

    public function testAdminResolverSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/admin/verificaciones/1');
        $result->assertStatus(401);
    }
}
