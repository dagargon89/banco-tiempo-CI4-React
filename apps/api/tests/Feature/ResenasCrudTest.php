<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Exceptions\ConflictException;
use App\Models\ResenaModel;
use App\Services\OfertaService;
use App\Services\ResenaService;
use App\Services\VinculacionService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests de integración para el flujo CRUD de reseñas.
 * Crea datos de prueba en setUp y los limpia en tearDown (mismo patrón que VinculacionesCrudIntegrationTest).
 */
final class ResenasCrudTest extends CIUnitTestCase
{
    private ResenaService $service;

    private int $oferenteId  = 0;
    private int $buscadorId  = 0;
    private int $categoriaId = 0;
    private int $ofertaId    = 0;
    private int $vincCompletadaId = 0;
    private int $vincAceptadaId   = 0;
    private string $testSuffix    = '';
    private array $createdResenaIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->service    = new ResenaService();
        $this->testSuffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: oferente verificado
        $db->table('users')->insert([
            'firebase_uid'        => "res-oferente-{$this->testSuffix}",
            'nombre'              => 'Oferente Resena',
            'email'               => "res-oferente-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->oferenteId = (int) $db->insertID();

        // Seed: buscador verificado
        $db->table('users')->insert([
            'firebase_uid'        => "res-buscador-{$this->testSuffix}",
            'nombre'              => 'Buscador Resena',
            'email'               => "res-buscador-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->buscadorId = (int) $db->insertID();

        // Seed: categoría
        $db->table('categorias')->insert([
            'nombre' => "ResCat {$this->testSuffix}",
            'slug'   => "res-cat-{$this->testSuffix}",
            'activa' => 1,
        ]);
        $this->categoriaId = (int) $db->insertID();

        // Seed: oferta activa
        $ofertaService = new OfertaService();
        $oferta = $ofertaService->crear($this->oferenteId, [
            'titulo'               => 'Oferta para resena test',
            'categoria_id'         => $this->categoriaId,
            'descripcion_breve'    => 'Descripcion breve con mas de cuarenta caracteres para test.',
            'descripcion_completa' => 'Detalle completo de la oferta para resena test.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
        $this->ofertaId = (int) $oferta['id'];

        // Seed: vinculación completada (buscador marca interés → oferente acepta → ambos confirman)
        $vincService = new VinculacionService();
        $vinc = $vincService->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $vincService->aceptar($vincId, $this->oferenteId, '127.0.0.1');
        $vincService->confirmar($vincId, $this->oferenteId, '127.0.0.1');
        $vincService->confirmar($vincId, $this->buscadorId, '127.0.0.1');
        $this->vincCompletadaId = $vincId;

        // Seed: segunda oferta + vinculación solo aceptada (para test de no-completada)
        $oferta2 = $ofertaService->crear($this->oferenteId, [
            'titulo'               => 'Oferta aceptada para resena test',
            'categoria_id'         => $this->categoriaId,
            'descripcion_breve'    => 'Otra descripcion breve con mas de cuarenta caracteres aqui.',
            'descripcion_completa' => 'Detalle completo de la segunda oferta para test.',
            'modalidad'            => 'presencial',
            'zona'                 => 'CDMX Centro',
        ], '127.0.0.1');
        $vinc2 = $vincService->marcarInteres((int) $oferta2['id'], $this->buscadorId, '127.0.0.1');
        $vincService->aceptar((int) $vinc2['id'], $this->oferenteId, '127.0.0.1');
        $this->vincAceptadaId = (int) $vinc2['id'];
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        // Limpiar reseñas
        foreach ($this->createdResenaIds as $id) {
            $db->table('resenas')->where('id', $id)->delete();
        }

        // Limpiar conversaciones y vinculaciones
        foreach ([$this->vincCompletadaId, $this->vincAceptadaId] as $id) {
            if ($id > 0) {
                $db->table('conversaciones')->where('vinculacion_id', $id)->delete();
                $db->table('vinculaciones')->where('id', $id)->delete();
            }
        }

        // Limpiar ofertas (vincular primero por si hay más vinculaciones)
        if ($this->ofertaId > 0) {
            $db->table('vinculaciones')->where('oferta_id', $this->ofertaId)->delete();
            $db->table('oferta_imagenes')->where('oferta_id', $this->ofertaId)->delete();
            $db->table('ofertas')->where('id', $this->ofertaId)->delete();
        }
        // Buscar la segunda oferta
        $db->table('ofertas')->where('user_id', $this->oferenteId)
            ->where('titulo LIKE', '%aceptada para resena test%')->delete();

        // Limpiar auditoría y usuarios
        $userIds = [$this->oferenteId, $this->buscadorId];
        $db->table('auditoria')->whereIn('actor_id', $userIds)->delete();
        $db->table('resenas')->whereIn('autor_id', $userIds)->delete();
        $db->table('resenas')->whereIn('destino_id', $userIds)->delete();
        $db->table('users')->whereIn('id', $userIds)->delete();

        if ($this->categoriaId > 0) {
            $db->table('categorias')->where('id', $this->categoriaId)->delete();
        }

        parent::tearDown();
    }

    /** Crear reseña en vinculación completada → datos correctos */
    public function testCrearResenaEnCompletada(): void
    {
        $resena = $this->service->crear($this->vincCompletadaId, $this->buscadorId, [
            'calificacion' => 5,
            'comentario'   => 'Excelente experiencia',
        ], '127.0.0.1');
        $this->createdResenaIds[] = (int) $resena['id'];

        $this->assertNotNull($resena);
        $this->assertEquals(5, (int) $resena['calificacion']);
        $this->assertEquals($this->buscadorId, (int) $resena['autor_id']);
        $this->assertEquals($this->oferenteId, (int) $resena['destino_id']);
    }

    /** Crear reseña duplicada → ConflictException */
    public function testCrearResenaDuplicadaFalla(): void
    {
        $resena = $this->service->crear($this->vincCompletadaId, $this->buscadorId, [
            'calificacion' => 5,
        ], '127.0.0.1');
        $this->createdResenaIds[] = (int) $resena['id'];

        $this->expectException(ConflictException::class);
        $this->service->crear($this->vincCompletadaId, $this->buscadorId, [
            'calificacion' => 4,
        ], '127.0.0.1');
    }

    /** Crear en vinculación no completada → DomainException */
    public function testCrearResenaEnNoCompletadaFalla(): void
    {
        $this->expectException(\DomainException::class);
        $this->service->crear($this->vincAceptadaId, $this->buscadorId, [
            'calificacion' => 5,
        ], '127.0.0.1');
    }

    /** GET reseñas públicas con paginación y estadísticas */
    public function testListarResenasPublicas(): void
    {
        $resena = $this->service->crear($this->vincCompletadaId, $this->buscadorId, [
            'calificacion' => 4,
            'comentario'   => 'Bien',
        ], '127.0.0.1');
        $this->createdResenaIds[] = (int) $resena['id'];

        $result = $this->service->deUsuario($this->oferenteId, 1, 10);

        $this->assertArrayHasKey('items', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertArrayHasKey('estadisticas', $result);
        $this->assertGreaterThanOrEqual(1, $result['total']);
    }

    /** Reportar reseña ajena → marca reportada */
    public function testReportarResenaAjena(): void
    {
        $resena = $this->service->crear($this->vincCompletadaId, $this->buscadorId, [
            'calificacion' => 3,
        ], '127.0.0.1');
        $this->createdResenaIds[] = (int) $resena['id'];

        // El oferente reporta la reseña del buscador
        $this->service->reportar((int) $resena['id'], $this->oferenteId, '127.0.0.1');

        $updated = model(ResenaModel::class)->find((int) $resena['id']);
        $this->assertEquals(1, (int) $updated['reportada']);
    }

    /** Admin ocultar → reseña no aparece en públicas */
    public function testAdminOcultarResena(): void
    {
        $resena = $this->service->crear($this->vincCompletadaId, $this->buscadorId, [
            'calificacion' => 2,
        ], '127.0.0.1');
        $this->createdResenaIds[] = (int) $resena['id'];

        $this->service->ocultar((int) $resena['id'], $this->oferenteId, ['moderador'], '127.0.0.1');

        $updated = model(ResenaModel::class)->find((int) $resena['id']);
        $this->assertEquals(1, (int) $updated['oculta']);

        // La reseña no debe aparecer en las públicas
        $result = $this->service->deUsuario($this->oferenteId, 1, 10);
        $ids = array_column($result['items'], 'id');
        $this->assertNotContains((string) $resena['id'], $ids);
    }

    /** Calificación inválida no llega al service (el controller la valida) */
    public function testUsuarioNoPartNoPuedeCrear(): void
    {
        $this->expectException(\DomainException::class);
        $this->service->crear($this->vincCompletadaId, 99999, [
            'calificacion' => 5,
        ], '127.0.0.1');
    }
}
