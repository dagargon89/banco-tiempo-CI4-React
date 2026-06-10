<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Controllers\Api\V1\Admin\Categorias;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;

/**
 * Feature tests para PATCH /admin/categorias/{id} y
 * PATCH /admin/categorias/{id}/activa (super_admin).
 */
final class CategoriasTest extends CIUnitTestCase
{
    use ControllerTestTrait;

    private int $adminUserId = 0;
    private int $categoriaId = 0;
    private int $otraCategoriaId = 0;
    private string $suffix = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = bin2hex(random_bytes(6));
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Super admin
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-superadmin-cat-{$this->suffix}",
            'nombre'              => 'Super Admin Cats',
            'email'               => "superadmin-cat-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);
        $this->adminUserId = (int) $db->insertID();

        $db->table('role_user')->ignore(true)->insert([
            'user_id' => $this->adminUserId,
            'role_id' => 1, // super_admin
        ]);

        // Categoría base
        $db->table('categorias')->insert([
            'nombre' => "Cat Base {$this->suffix}",
            'slug'   => "cat-base-{$this->suffix}",
            'activa' => 1,
        ]);
        $this->categoriaId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        if ($this->categoriaId > 0) {
            $db->table('categorias')->where('id', $this->categoriaId)->delete();
        }
        if ($this->otraCategoriaId > 0) {
            $db->table('categorias')->where('id', $this->otraCategoriaId)->delete();
        }

        if ($this->adminUserId > 0) {
            $db->table('role_user')->where('user_id', $this->adminUserId)->delete();
            $db->table('auditoria')->where('actor_id', $this->adminUserId)->delete();
            $db->table('users')->where('id', $this->adminUserId)->delete();
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

    // ── Test 1: update cambia nombre y regenera slug ──

    public function testUpdateCambiaElNombre(): void
    {
        $result = $this->withUri("http://localhost/api/v1/admin/categorias/{$this->categoriaId}")
            ->withBody(json_encode(['nombre' => 'Música Clásica']))
            ->controller(Categorias::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('update', $this->categoriaId);

        $response->assertStatus(200);

        $db  = \Config\Database::connect();
        $cat = $db->table('categorias')->where('id', $this->categoriaId)->get()->getRowArray();
        $this->assertIsArray($cat);
        $this->assertSame('Música Clásica', $cat['nombre']);
        $this->assertSame('musica-clasica', $cat['slug']);
    }

    // ── Test 2: toggleActiva cambia el estado ──

    public function testToggleActivaCambiaElEstado(): void
    {
        $result = $this->withUri("http://localhost/api/v1/admin/categorias/{$this->categoriaId}/activa")
            ->withBody(json_encode(['activa' => false]))
            ->controller(Categorias::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('toggleActiva', $this->categoriaId);

        $response->assertStatus(200);

        $db  = \Config\Database::connect();
        $cat = $db->table('categorias')->where('id', $this->categoriaId)->get()->getRowArray();
        $this->assertIsArray($cat);
        $this->assertSame(0, (int) $cat['activa']);
    }

    // ── Test 3: 409 si el nombre genera un slug duplicado ──

    public function testUpdateRechazaNombreDuplicado(): void
    {
        $db = \Config\Database::connect();
        $db->table('categorias')->insert([
            'nombre' => "Otra Cat {$this->suffix}",
            'slug'   => "otra-cat-{$this->suffix}",
            'activa' => 1,
        ]);
        $this->otraCategoriaId = (int) $db->insertID();

        // Intentar renombrar la otra categoría al mismo nombre de la base
        $result = $this->withUri("http://localhost/api/v1/admin/categorias/{$this->otraCategoriaId}")
            ->withBody(json_encode(['nombre' => "Cat Base {$this->suffix}"]))
            ->controller(Categorias::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('update', $this->otraCategoriaId);

        $response->assertStatus(409);
    }

    // ── Test 4: 422 con nombre vacío o demasiado largo ──

    public function testUpdateRechazaNombreVacioOLargo(): void
    {
        // Nombre vacío
        $result = $this->withUri("http://localhost/api/v1/admin/categorias/{$this->categoriaId}")
            ->withBody(json_encode(['nombre' => '']))
            ->controller(Categorias::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('update', $this->categoriaId);
        $response->assertStatus(422);

        // Nombre demasiado largo (>80 chars)
        $largo = str_repeat('a', 81);

        $result2 = $this->withUri("http://localhost/api/v1/admin/categorias/{$this->categoriaId}")
            ->withBody(json_encode(['nombre' => $largo]))
            ->controller(Categorias::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response2 = $result2->execute('update', $this->categoriaId);
        $response2->assertStatus(422);
    }
}
