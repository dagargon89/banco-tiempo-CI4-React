<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Controllers\Api\V1\Admin\Ofertas;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;

/**
 * Feature tests para GET /admin/ofertas/{id}.
 *
 * - Devuelve detalle de la oferta con flag `oferente_inactivo` cuando el
 *   usuario oferente tiene deleted_at no nulo, y respeta `pausada_por_admin`.
 * - 404 si la oferta no existe.
 */
final class OfertasDetalleTest extends CIUnitTestCase
{
    use ControllerTestTrait;

    private int $oferenteId  = 0;
    private int $adminUserId = 0;
    private int $ofertaId    = 0;
    private int $categoriaId = 0;
    private string $suffix   = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = bin2hex(random_bytes(6));
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Oferente dado de baja (soft delete)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-oferente-{$this->suffix}",
            'nombre'              => 'Oferente Baja',
            'email'               => "oferente-baja-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'baja',
            'deleted_at'          => $now,
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);
        $this->oferenteId = (int) $db->insertID();

        // Admin con rol moderador
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-admin-of-{$this->suffix}",
            'nombre'              => 'Admin Ofertas',
            'email'               => "admin-ofertas-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);
        $this->adminUserId = (int) $db->insertID();

        $db->table('role_user')->ignore(true)->insert([
            'user_id' => $this->adminUserId,
            'role_id' => 2,
        ]);

        // Categoría
        $db->table('categorias')->insert([
            'nombre' => "Cat Ofertas Detalle {$this->suffix}",
            'slug'   => "cat-ofertas-detalle-{$this->suffix}",
            'activa' => 1,
        ]);
        $this->categoriaId = (int) $db->insertID();

        // Oferta pausada por admin (porque el oferente fue dado de baja)
        $db->table('ofertas')->insert([
            'user_id'           => $this->oferenteId,
            'categoria_id'      => $this->categoriaId,
            'titulo'               => "Oferta Test {$this->suffix}",
            'descripcion_breve'    => 'Descripción breve de prueba',
            'descripcion_completa' => 'Descripción completa de prueba para test de detalle.',
            'modalidad'            => 'presencial',
            'zona'              => 'Centro',
            'estado'            => 'pausada',
            'pausada_por_admin' => 1,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);
        $this->ofertaId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        if ($this->ofertaId > 0) {
            $db->table('oferta_imagenes')->where('oferta_id', $this->ofertaId)->delete();
            $db->table('vinculaciones')->where('oferta_id', $this->ofertaId)->delete();
            $db->table('ofertas')->where('id', $this->ofertaId)->delete();
        }

        if ($this->categoriaId > 0) {
            $db->table('categorias')->where('id', $this->categoriaId)->delete();
        }

        $userIds = array_filter([$this->oferenteId, $this->adminUserId], static fn (int $id): bool => $id > 0);
        if ($userIds !== []) {
            $db->table('role_user')->whereIn('user_id', $userIds)->delete();
            $db->table('auditoria')->whereIn('actor_id', $userIds)->delete();
            $db->table('users')->whereIn('id', $userIds)->delete();
        }

        parent::tearDown();
    }

    /** Decodifica el cuerpo JSON de la respuesta. */
    private function decodeBody(\CodeIgniter\HTTP\ResponseInterface $response): array
    {
        $body    = (string) $response->getBody();
        $decoded = json_decode($body, true);
        $this->assertIsArray($decoded, "Respuesta no es JSON válido: {$body}");

        return $decoded;
    }

    // ── Test 1: show con flag oferente_inactivo ──

    public function testShowReturnsOfertaConOferenteInactivoFlag(): void
    {
        $result = $this->withUri("http://localhost/api/v1/admin/ofertas/{$this->ofertaId}")
            ->controller(Ofertas::class)
            ->execute('show', $this->ofertaId);

        $result->assertStatus(200);

        $body = $this->decodeBody($result->response());
        $this->assertArrayHasKey('data', $body);
        $data = $body['data'];

        $this->assertSame($this->ofertaId, (int) $data['id']);
        $this->assertArrayHasKey('oferente_inactivo', $data);
        $this->assertTrue((bool) $data['oferente_inactivo'], 'oferente_inactivo debe ser truthy.');
        $this->assertArrayHasKey('pausada_por_admin', $data);
        $this->assertSame(1, (int) $data['pausada_por_admin']);
    }

    // ── Test 2: 404 si la oferta no existe ──

    public function testShowReturns404WhenOfertaNotFound(): void
    {
        $db     = \Config\Database::connect();
        $exists = $db->table('ofertas')->where('id', 999999)->countAllResults();
        $this->assertSame(0, $exists, 'La oferta id=999999 debe no existir para test de isolation.');

        $result = $this->withUri('http://localhost/api/v1/admin/ofertas/999999')
            ->controller(Ofertas::class)
            ->execute('show', 999999);

        $result->assertStatus(404);
    }
}
