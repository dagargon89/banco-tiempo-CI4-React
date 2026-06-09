<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Exceptions\ConflictException;
use App\Models\ResenaModel;
use App\Models\VinculacionModel;
use App\Services\ResenaService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * Tests de integración para el flujo CRUD de reseñas.
 * Requieren base de datos de testing con seed de datos.
 */
final class ResenasCrudTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrateOnce = true;
    protected $seedOnce    = true;
    protected $seed        = 'Tests\Support\Seeds\ResenasSeed';

    private ResenaService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ResenaService();
    }

    /** Crear reseña en vinculación completada → 201 */
    public function testCrearResenaEnCompletada(): void
    {
        // El seed crea vinculación id=1 completada: buscador=1, oferente=2
        $resena = $this->service->crear(1, 1, [
            'calificacion' => 5,
            'comentario'   => 'Excelente experiencia',
        ], '127.0.0.1');

        $this->assertNotNull($resena);
        $this->assertEquals(5, (int) $resena['calificacion']);
        $this->assertEquals(1, (int) $resena['autor_id']);
        $this->assertEquals(2, (int) $resena['destino_id']);
    }

    /** Crear reseña duplicada → ConflictException */
    public function testCrearResenaDuplicadaFalla(): void
    {
        // Crear primera
        $this->service->crear(1, 1, ['calificacion' => 5], '127.0.0.1');

        $this->expectException(ConflictException::class);
        $this->service->crear(1, 1, ['calificacion' => 4], '127.0.0.1');
    }

    /** Crear en vinculación no completada → DomainException */
    public function testCrearResenaEnNoCompletadaFalla(): void
    {
        // El seed crea vinculación id=2 aceptada
        $this->expectException(\DomainException::class);
        $this->service->crear(2, 1, ['calificacion' => 5], '127.0.0.1');
    }

    /** GET reseñas públicas con paginación */
    public function testListarResenasPublicas(): void
    {
        // Crear reseña primero
        $this->service->crear(1, 1, ['calificacion' => 4, 'comentario' => 'Bien'], '127.0.0.1');

        $result = $this->service->deUsuario(2, 1, 10);

        $this->assertArrayHasKey('items', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertArrayHasKey('estadisticas', $result);
        $this->assertGreaterThanOrEqual(1, $result['total']);
    }

    /** Reportar reseña ajena → ok */
    public function testReportarResenaAjena(): void
    {
        $resena = $this->service->crear(1, 1, ['calificacion' => 3], '127.0.0.1');

        // Usuario 2 reporta la reseña de usuario 1
        $this->service->reportar((int) $resena['id'], 2, '127.0.0.1');

        $updated = model(ResenaModel::class)->find((int) $resena['id']);
        $this->assertEquals(1, (int) $updated['reportada']);
    }

    /** Admin ocultar → reseña no aparece en públicas */
    public function testAdminOcultarResena(): void
    {
        $resena = $this->service->crear(1, 1, ['calificacion' => 2], '127.0.0.1');

        $this->service->ocultar((int) $resena['id'], 99, ['moderador'], '127.0.0.1');

        $updated = model(ResenaModel::class)->find((int) $resena['id']);
        $this->assertEquals(1, (int) $updated['oculta']);

        // La reseña no debe aparecer en las públicas
        $result = $this->service->deUsuario(2, 1, 10);
        $ids = array_column($result['items'], 'id');
        $this->assertNotContains($resena['id'], $ids);
    }
}
