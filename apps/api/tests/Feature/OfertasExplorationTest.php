<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests de exploración pública (§2.4, SEC-03).
 *
 * Los endpoints GET /ofertas son públicos y no requieren autenticación.
 * Se prueban filtros, paginación, estructura JSON y resistencia a inyección SQL.
 */
final class OfertasExplorationTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── Exploración básica ──

    public function testExplorarDevuelve200(): void
    {
        $result = $this->get('api/v1/ofertas');
        $result->assertStatus(200);
    }

    public function testExplorarDevuelveEstructuraJsonCorrecta(): void
    {
        $result = $this->get('api/v1/ofertas');
        $result->assertStatus(200);

        $json = json_decode($result->getJSON(), true);
        $this->assertArrayHasKey('data', $json);
        $this->assertArrayHasKey('meta', $json);
        $this->assertArrayHasKey('total', $json['meta']);
        $this->assertArrayHasKey('page', $json['meta']);
        $this->assertArrayHasKey('per_page', $json['meta']);
    }

    // ── Filtros (§2.4: filtrar por categoría/modalidad/zona) ──

    public function testExplorarConFiltrosDevuelve200(): void
    {
        $result = $this->get('api/v1/ofertas?categoria_id=1&modalidad=presencial&zona=Centro&q=guitarra');
        $result->assertStatus(200);
    }

    public function testExplorarConCategoriaSolaDevuelve200(): void
    {
        $result = $this->get('api/v1/ofertas?categoria_id=1');
        $result->assertStatus(200);
    }

    public function testExplorarConModalidadSolaDevuelve200(): void
    {
        $result = $this->get('api/v1/ofertas?modalidad=virtual');
        $result->assertStatus(200);
    }

    public function testExplorarConZonaSolaDevuelve200(): void
    {
        $result = $this->get('api/v1/ofertas?zona=Norte');
        $result->assertStatus(200);
    }

    public function testExplorarConBusquedaDevuelve200(): void
    {
        $result = $this->get('api/v1/ofertas?q=clases');
        $result->assertStatus(200);
    }

    // ── Paginación (§2.4: per_page max 50) ──

    public function testPaginacionRespetaMaximo50(): void
    {
        $result = $this->get('api/v1/ofertas?per_page=100');
        $result->assertStatus(200);

        $json = json_decode($result->getJSON(), true);
        $this->assertLessThanOrEqual(50, $json['meta']['per_page']);
    }

    public function testPaginacionPagina1PorDefecto(): void
    {
        $result = $this->get('api/v1/ofertas');
        $result->assertStatus(200);

        $json = json_decode($result->getJSON(), true);
        $this->assertSame(1, $json['meta']['page']);
    }

    // ── SEC-03: SQL injection en filtros de exploración ──

    public function testSqlInjectionEnQueryNoRompe(): void
    {
        $result = $this->get("api/v1/ofertas?q=' OR 1=1 --");
        $result->assertStatus(200);
    }

    public function testSqlInjectionEnCategoriaIdNoRompe(): void
    {
        // categoria_id espera un entero; inyección se castea a 0
        $result = $this->get('api/v1/ofertas?categoria_id=1;DROP+TABLE+ofertas;');
        $result->assertStatus(200);
    }

    public function testSqlInjectionEnZonaNoRompe(): void
    {
        $result = $this->get("api/v1/ofertas?zona=' UNION SELECT * FROM users --");
        $result->assertStatus(200);
    }

    public function testSqlInjectionEnModalidadNoRompe(): void
    {
        $result = $this->get("api/v1/ofertas?modalidad=presencial' AND '1'='1");
        $result->assertStatus(200);
    }

    // ── Detalle ──

    public function testOfertaInexistenteDevuelve404(): void
    {
        $result = $this->get('api/v1/ofertas/999999');
        // 404 o 401 (si el endpoint requiere auth para el detalle)
        $status = (int) $result->response()->getStatusCode();
        $this->assertContains($status, [401, 404]);
    }
}
