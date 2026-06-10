<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Controllers\Api\V1\Admin\Usuarios;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;

/**
 * Feature tests para GET /admin/usuarios/{id}.
 *
 * - Devuelve detalle del usuario con contadores agregados.
 * - Si el usuario tiene deleted_at, incluye bloque `baja` con metadatos.
 * - 404 si el usuario no existe.
 *
 * Los tests llaman al controlador directamente para evitar el auth filter
 * de Firebase (el filtro inyecta X-Auth-UserId, pero el método show no lo lee).
 */
final class UsuariosShowTest extends CIUnitTestCase
{
    use ControllerTestTrait;

    private int $targetUserId = 0;
    private int $adminUserId  = 0;
    private string $suffix    = '';

    /** @var list<int> */
    private array $extraUserIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: usuario target (regular, activo)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-show-target-{$this->suffix}",
            'nombre'              => 'Target Show',
            'email'               => "show-target-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->targetUserId = (int) $db->insertID();

        // Seed: usuario admin con rol moderador
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-show-admin-{$this->suffix}",
            'nombre'              => 'Admin Show',
            'email'               => "show-admin-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->adminUserId = (int) $db->insertID();

        // Asignar rol moderador (role_id = 2 según seeder)
        $db->table('role_user')->ignore(true)->insert([
            'user_id' => $this->adminUserId,
            'role_id' => 2,
        ]);
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        $allUserIds = array_merge(
            [$this->targetUserId, $this->adminUserId],
            $this->extraUserIds,
        );
        $allUserIds = array_filter($allUserIds, static fn (int $id): bool => $id > 0);

        if ($allUserIds !== []) {
            // Limpiar dependencias antes de borrar users
            $db->table('role_user')->whereIn('user_id', $allUserIds)->delete();
            $db->table('auditoria')->whereIn('actor_id', $allUserIds)->delete();
            $db->table('auditoria')
                ->whereIn('entidad_id', $allUserIds)
                ->where('entidad_tipo', 'user')
                ->delete();
            $db->table('users')->whereIn('id', $allUserIds)->delete();
        }

        $this->extraUserIds = [];

        parent::tearDown();
    }

    /** Decodifica el cuerpo JSON de la respuesta. */
    private function decodeBody(\CodeIgniter\HTTP\ResponseInterface $response): array
    {
        $body = (string) $response->getBody();
        $decoded = json_decode($body, true);
        $this->assertIsArray($decoded, "Respuesta no es JSON válido: {$body}");
        return $decoded;
    }

    // ── Test 1: detalle de usuario activo ──

    public function testShowReturnsUserDetails(): void
    {
        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->targetUserId}")
            ->controller(Usuarios::class)
            ->execute('show', $this->targetUserId);

        $result->assertStatus(200);

        $body = $this->decodeBody($result->response());
        $this->assertArrayHasKey('data', $body);
        $data = $body['data'];

        $this->assertSame($this->targetUserId, (int) $data['id']);
        $this->assertArrayHasKey('counts', $data);
        $this->assertArrayHasKey('ofertas_activas', $data['counts']);
        $this->assertArrayHasKey('ofertas_pausadas_por_admin', $data['counts']);
        $this->assertArrayHasKey('vinculaciones_completadas', $data['counts']);
        $this->assertArrayHasKey('resenas_recibidas', $data['counts']);
        $this->assertArrayHasKey('baja', $data);
        $this->assertNull($data['baja']);
    }

    // ── Test 2: usuario dado de baja con info en bloque `baja` ──

    public function testShowReturnsBajaInfoWhenUserIsDeleted(): void
    {
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Marcar al target como baja (soft delete + metadatos)
        $db->table('users')->where('id', $this->targetUserId)->update([
            'estado_cuenta'    => 'baja',
            'deleted_at'       => $now,
            'baja_motivo'      => 'spam',
            'baja_por_user_id' => $this->adminUserId,
            'updated_at'       => $now,
        ]);

        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->targetUserId}")
            ->controller(Usuarios::class)
            ->execute('show', $this->targetUserId);

        $result->assertStatus(200);

        $body = $this->decodeBody($result->response());
        $data = $body['data'];

        $this->assertArrayHasKey('baja', $data);
        $this->assertNotNull($data['baja']);
        $this->assertIsString($data['baja']['fecha']);
        $this->assertSame('spam', $data['baja']['motivo']);
        $this->assertIsArray($data['baja']['dado_baja_por']);
        $this->assertSame($this->adminUserId, (int) $data['baja']['dado_baja_por']['id']);
        $this->assertArrayHasKey('nombre', $data['baja']['dado_baja_por']);

        // Los campos crudos no deben aparecer en data
        $this->assertArrayNotHasKey('baja_motivo', $data);
        $this->assertArrayNotHasKey('baja_por_user_id', $data);
    }

    // ── Test 3: 404 si no existe ──

    public function testShowReturns404WhenNotFound(): void
    {
        // Verificar isolation: el id 999999 no existe en la BD
        $db = \Config\Database::connect();
        $exists = $db->table('users')->where('id', 999999)->countAllResults();
        $this->assertSame(0, $exists, 'El usuario id=999999 debe no existir para test de isolation.');

        $result = $this->withUri('http://localhost/api/v1/admin/usuarios/999999')
            ->controller(Usuarios::class)
            ->execute('show', 999999);

        $result->assertStatus(404);
    }
}
