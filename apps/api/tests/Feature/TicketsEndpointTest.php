<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class TicketsEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── 401 en endpoints protegidos sin auth ──

    public function testCrearTicketSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/tickets');
        $result->assertStatus(401);
    }

    public function testMisTicketsSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/tickets/mios');
        $result->assertStatus(401);
    }

    // ── Admin endpoints sin auth → 401 ──

    public function testAdminTicketsIndexSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/tickets');
        $result->assertStatus(401);
    }

    public function testAdminTicketsAsignarSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/admin/tickets/1/asignar');
        $result->assertStatus(401);
    }

    public function testAdminTicketsCambiarEstadoSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/admin/tickets/1/estado');
        $result->assertStatus(401);
    }

    // ── Admin usuarios endpoints ──

    public function testAdminUsuariosIndexSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/usuarios');
        $result->assertStatus(401);
    }

    public function testAdminUsuariosCambiarEstadoSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/admin/usuarios/1/estado');
        $result->assertStatus(401);
    }

    // ── Admin metricas ──

    public function testAdminMetricasSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/metricas');
        $result->assertStatus(401);
    }

    // ── Super admin endpoints ──

    public function testAdminCategoriasCrearSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/admin/categorias');
        $result->assertStatus(401);
    }

    public function testAdminModeradoresCrearSinAuthDevuelve401(): void
    {
        $result = $this->post('api/v1/admin/moderadores');
        $result->assertStatus(401);
    }

    public function testAdminModeradoresEliminarSinAuthDevuelve401(): void
    {
        $result = $this->delete('api/v1/admin/moderadores/1');
        $result->assertStatus(401);
    }
}
