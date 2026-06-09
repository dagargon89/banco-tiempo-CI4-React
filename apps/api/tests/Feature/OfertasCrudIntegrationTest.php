<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\OfertaService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests de integración CRUD de ofertas (§2.3, SEC-04).
 *
 * Prueban el servicio directamente con BD real:
 * - Creación con datos válidos
 * - Almacenamiento de payloads XSS sin transformación (SEC-04)
 * - Validación presencial + zona
 * - Ofertas pausadas/eliminadas fuera de exploración
 * - Edición solo por dueño (IDOR)
 */
final class OfertasCrudIntegrationTest extends CIUnitTestCase
{
    private int $testUserId      = 0;
    private int $testOtroUserId  = 0;
    private int $testCategoriaId = 0;
    private string $testSuffix   = '';
    private array $createdOfertaIds = [];
    private array $extraUserIds     = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->testSuffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: usuario verificado
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-crud-{$this->testSuffix}",
            'nombre'              => 'Test User CRUD',
            'email'               => "crud-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->testUserId = (int) $db->insertID();

        // Seed: segundo usuario (para probar IDOR)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-otro-{$this->testSuffix}",
            'nombre'              => 'Otro User',
            'email'               => "otro-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->testOtroUserId = (int) $db->insertID();

        // Seed: categoría activa (nombre único)
        $db->table('categorias')->insert([
            'nombre' => "TestCat {$this->testSuffix}",
            'slug'   => "test-crud-{$this->testSuffix}",
            'activa' => 1,
        ]);
        $this->testCategoriaId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        // Limpiar ofertas creadas
        foreach ($this->createdOfertaIds as $id) {
            $db->table('oferta_imagenes')->where('oferta_id', $id)->delete();
            $db->table('ofertas')->where('id', $id)->delete();
        }

        // Limpiar auditoría
        $allUserIds = array_merge([$this->testUserId, $this->testOtroUserId], $this->extraUserIds);
        if ($allUserIds !== []) {
            $db->table('auditoria')->whereIn('actor_id', $allUserIds)->delete();
        }

        // Limpiar datos de test
        if ($this->testCategoriaId > 0) {
            $db->table('categorias')->where('id', $this->testCategoriaId)->delete();
        }
        if ($allUserIds !== []) {
            $db->table('users')->whereIn('id', $allUserIds)->delete();
        }

        $this->createdOfertaIds = [];
        $this->extraUserIds     = [];

        parent::tearDown();
    }

    // ── §2.3: Usuario verificado crea oferta válida ──

    public function testCrearOfertaValidaRetornaOfertaActiva(): void
    {
        $service = new OfertaService();

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Clases de guitarra para principiantes',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Aprende acordes basicos en cuatro sesiones de una hora.',
            'descripcion_completa' => 'Detalle completo de las clases de guitarra.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');

        $this->createdOfertaIds[] = (int) $oferta['id'];

        $this->assertIsArray($oferta);
        $this->assertArrayHasKey('id', $oferta);
        $this->assertSame('activa', $oferta['estado']);
        $this->assertSame($this->testUserId, (int) $oferta['user_id']);
    }

    public function testCrearOfertaPresencialConZona(): void
    {
        $service = new OfertaService();

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Taller de pintura al oleo en mi taller',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Sesiones individuales de pintura al oleo para principiantes.',
            'descripcion_completa' => 'Sesiones detalladas de pintura.',
            'modalidad'            => 'presencial',
            'zona'                 => 'Centro',
        ], '127.0.0.1');

        $this->createdOfertaIds[] = (int) $oferta['id'];

        $this->assertSame('presencial', $oferta['modalidad']);
        $this->assertSame('Centro', $oferta['zona']);
    }

    // ── §2.3: modalidad=presencial sin zona → error ──

    public function testPresencialSinZonaLanzaExcepcion(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('zona es obligatoria');

        $service = new OfertaService();
        $service->crear($this->testUserId, [
            'titulo'               => 'Oferta presencial sin zona definida aqui',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Esta oferta deberia fallar porque no tiene zona definida.',
            'descripcion_completa' => 'Detalle de la oferta sin zona.',
            'modalidad'            => 'presencial',
            'zona'              => '',
        ], '127.0.0.1');
    }

    // ── SEC-04: Payload con <script> se almacena tal cual ──

    public function testXssPayloadSeAlmacenaSinTransformacion(): void
    {
        $service = new OfertaService();
        $xssBreve    = '<script>alert("xss")</script> Clases de guitarra aqui';
        $xssCompleta = '<img src=x onerror=alert(1)> texto completo de la oferta';

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Oferta con payload XSS en titulo aqui',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => $xssBreve,
            'descripcion_completa' => $xssCompleta,
            'modalidad'            => 'virtual',
        ], '127.0.0.1');

        $this->createdOfertaIds[] = (int) $oferta['id'];

        // Verificar en BD que el payload se almacenó verbatim
        $db  = \Config\Database::connect();
        $row = $db->table('ofertas')->where('id', $oferta['id'])->get()->getRowArray();

        $this->assertStringContainsString('<script>', $row['descripcion_breve']);
        $this->assertStringContainsString('onerror=alert(1)', $row['descripcion_completa']);
    }

    // ── §2.3: Edición solo por dueño; otro usuario → DomainException (403) ──

    public function testEditarPorNoDuennoLanzaExcepcion(): void
    {
        $service = new OfertaService();

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Oferta para probar permisos de edicion',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Solo el duenno puede editar esta oferta publicada aqui.',
            'descripcion_completa' => 'Detalle completo de la oferta.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
        $this->createdOfertaIds[] = (int) $oferta['id'];

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('No tienes permiso');

        $service->actualizar((int) $oferta['id'], $this->testOtroUserId, [], [
            'titulo' => 'Intento de edicion no autorizada aqui',
        ], '127.0.0.1');
    }

    // ── §2.3: Oferta pausada/eliminada no aparece en exploración ──

    public function testOfertaPausadaNoApareceEnExploracion(): void
    {
        $service = new OfertaService();

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Oferta que sera pausada para test de exploracion',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Esta oferta debe desaparecer de exploracion al pausarla ahora.',
            'descripcion_completa' => 'Detalle completo de la oferta.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
        $this->createdOfertaIds[] = (int) $oferta['id'];
        $ofertaId = (int) $oferta['id'];

        $service->cambiarEstado($ofertaId, $this->testUserId, [], 'pausada', '127.0.0.1');

        $resultado = $service->explorar([], 1, 50);
        $ids = array_map('intval', array_column($resultado['items'], 'id'));
        $this->assertNotContains($ofertaId, $ids);
    }

    public function testOfertaEliminadaNoApareceEnExploracion(): void
    {
        $service = new OfertaService();

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Oferta que sera eliminada para test de exploracion',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Esta oferta no debe aparecer al eliminarla del sistema hoy.',
            'descripcion_completa' => 'Detalle completo de la oferta.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
        $this->createdOfertaIds[] = (int) $oferta['id'];
        $ofertaId = (int) $oferta['id'];

        $service->cambiarEstado($ofertaId, $this->testUserId, [], 'eliminada', '127.0.0.1');

        $resultado = $service->explorar([], 1, 50);
        $ids = array_map('intval', array_column($resultado['items'], 'id'));
        $this->assertNotContains($ofertaId, $ids);
    }

    // ── §2.4: Filtro por categoría devuelve solo coincidencias ──

    public function testFiltrarPorCategoriaDevuelveSoloCoincidencias(): void
    {
        $service = new OfertaService();

        $oferta = $service->crear($this->testUserId, [
            'titulo'               => 'Oferta de categoria especifica para filtro test',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'Oferta pertenece a una categoria de prueba especifica aqui.',
            'descripcion_completa' => 'Detalle completo de la oferta.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
        $this->createdOfertaIds[] = (int) $oferta['id'];

        $resultado = $service->explorar(['categoria_id' => $this->testCategoriaId], 1, 50);

        foreach ($resultado['items'] as $item) {
            $this->assertSame(
                $this->testCategoriaId,
                (int) $item['categoria_id'],
                'Todas las ofertas filtradas deben pertenecer a la categoría solicitada.',
            );
        }
        $this->assertGreaterThanOrEqual(1, count($resultado['items']));
    }

    // ── Usuario no verificado no puede crear ──

    public function testUsuarioNoVerificadoNoPuedeCrear(): void
    {
        $db = \Config\Database::connect();

        $db->table('users')->insert([
            'firebase_uid'        => "test-noverif-{$this->testSuffix}",
            'nombre'              => 'No Verificado',
            'email'               => "noverif-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'no_verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $noVerifId = (int) $db->insertID();
        $this->extraUserIds[] = $noVerifId;

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('verificado');

        $service = new OfertaService();
        $service->crear($noVerifId, [
            'titulo'               => 'Oferta de usuario no verificado aqui test',
            'categoria_id'         => $this->testCategoriaId,
            'descripcion_breve'    => 'No deberia poder crear esta oferta sin verificacion aqui.',
            'descripcion_completa' => 'Detalle completo de la oferta.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
    }
}
