<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Controllers\Api\V1\Admin\Usuarios;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;

/**
 * Feature tests para POST /admin/usuarios/{id}/baja.
 *
 * - 200 + ofertas_pausadas en éxito (cascade a ofertas activas).
 * - 403 si el admin intenta darse baja a sí mismo.
 * - 409 si el usuario ya está dado de baja.
 *
 * Los tests llaman al controlador directamente para evitar el auth filter
 * de Firebase. El método darBaja lee X-Auth-UserId del request, así que se
 * inyecta vía setHeader() sobre la instancia mock del request.
 *
 * UsuarioBajaService recibe skipFirebase=false, pero el servicio invoca
 * service('firebaseAuth')->revocarSesiones() dentro de un try/catch que solo
 * loguea; no afecta el resultado del test cuando Firebase no está configurado.
 */
final class UsuariosBajaTest extends CIUnitTestCase
{
    use ControllerTestTrait;

    private int $targetUserId = 0;
    private int $adminUserId  = 0;
    private string $suffix    = '';
    private int $categoriaId  = 0;

    /** @var list<int> */
    private array $extraUserIds = [];

    /** @var list<int> */
    private array $createdOfertaIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: usuario target (regular, activo, verificado)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-baja-target-{$this->suffix}",
            'nombre'              => 'Target Baja',
            'email'               => "baja-target-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->targetUserId = (int) $db->insertID();

        // Seed: usuario admin con rol moderador
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-baja-admin-{$this->suffix}",
            'nombre'              => 'Admin Baja',
            'email'               => "baja-admin-{$this->suffix}@test.local",
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

        // Seed: categoría activa (necesaria para crear oferta)
        $db->table('categorias')->insert([
            'nombre' => "TestCatBaja {$this->suffix}",
            'slug'   => "test-baja-{$this->suffix}",
            'activa' => 1,
        ]);
        $this->categoriaId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        // Limpiar ofertas creadas (incluye oferta_imagenes vía cascade)
        foreach ($this->createdOfertaIds as $id) {
            $db->table('oferta_imagenes')->where('oferta_id', $id)->delete();
            $db->table('ofertas')->where('id', $id)->delete();
        }

        $allUserIds = array_merge(
            [$this->targetUserId, $this->adminUserId],
            $this->extraUserIds,
        );
        $allUserIds = array_filter($allUserIds, static fn (int $id): bool => $id > 0);

        if ($allUserIds !== []) {
            // Quitar referencias baja_por_user_id antes de borrar users (FK SET NULL)
            $db->table('users')->whereIn('baja_por_user_id', $allUserIds)->update(['baja_por_user_id' => null]);

            $db->table('role_user')->whereIn('user_id', $allUserIds)->delete();
            $db->table('auditoria')->whereIn('actor_id', $allUserIds)->delete();
            $db->table('auditoria')
                ->whereIn('entidad_id', $allUserIds)
                ->where('entidad_tipo', 'user')
                ->delete();
            // Limpiar ofertas restantes asociadas a estos usuarios
            $db->table('ofertas')->whereIn('user_id', $allUserIds)->delete();
            $db->table('users')->whereIn('id', $allUserIds)->delete();
        }

        if ($this->categoriaId > 0) {
            $db->table('categorias')->where('id', $this->categoriaId)->delete();
        }

        $this->extraUserIds     = [];
        $this->createdOfertaIds = [];

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

    /** Inserta una oferta activa para el usuario indicado y devuelve su id. */
    private function insertOfertaActiva(int $userId): int
    {
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');
        $db->table('ofertas')->insert([
            'user_id'              => $userId,
            'categoria_id'         => $this->categoriaId,
            'titulo'               => "Oferta test {$this->suffix}",
            'descripcion_breve'    => 'Descripcion breve de prueba para test de baja.',
            'descripcion_completa' => 'Descripcion completa de la oferta de prueba para baja.',
            'modalidad'            => 'virtual',
            'tipo_capacidad'       => 'individual',
            'capacidad_maxima'     => 1,
            'estado'               => 'activa',
            'pausada_por_admin'    => 0,
            'created_at'           => $now,
            'updated_at'           => $now,
        ]);
        $id = (int) $db->insertID();
        $this->createdOfertaIds[] = $id;
        return $id;
    }

    // ── Test 1: 200 + ofertas pausadas y deleted_at marcado ──

    public function testDarBajaResponds200AndPausesOfertas(): void
    {
        // Crear una oferta activa para el target
        $ofertaId = $this->insertOfertaActiva($this->targetUserId);

        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->targetUserId}/baja")
            ->withBody(json_encode(['motivo' => 'spam']))
            ->controller(Usuarios::class);

        // Inyectar header X-Auth-UserId con el admin (lo lee el controlador)
        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('darBaja', $this->targetUserId);

        $response->assertStatus(200);

        $body = $this->decodeBody($response->response());
        $this->assertArrayHasKey('data', $body);
        $this->assertSame(1, (int) $body['data']['ofertas_pausadas']);

        // Verificar que el usuario quedó soft-deleted
        $db = \Config\Database::connect();
        $user = $db->table('users')
            ->select('deleted_at, estado_cuenta, baja_motivo, baja_por_user_id')
            ->where('id', $this->targetUserId)
            ->get()
            ->getRowArray();
        $this->assertIsArray($user);
        $this->assertNotNull($user['deleted_at']);
        $this->assertSame('baja', $user['estado_cuenta']);
        $this->assertSame('spam', $user['baja_motivo']);
        $this->assertSame($this->adminUserId, (int) $user['baja_por_user_id']);

        // Verificar que la oferta quedó pausada y marcada por admin
        $oferta = $db->table('ofertas')
            ->select('estado, pausada_por_admin')
            ->where('id', $ofertaId)
            ->get()
            ->getRowArray();
        $this->assertIsArray($oferta);
        $this->assertSame('pausada', $oferta['estado']);
        $this->assertSame(1, (int) $oferta['pausada_por_admin']);
    }

    // ── Test 2: 403 si el admin intenta auto-baja ──

    public function testAutoBajaForbidden(): void
    {
        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->adminUserId}/baja")
            ->withBody(json_encode(['motivo' => 'auto']))
            ->controller(Usuarios::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('darBaja', $this->adminUserId);

        $response->assertStatus(403);
    }

    // ── Test 3: 409 si el usuario ya está dado de baja ──

    public function testYaEnBajaConflict(): void
    {
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Marcar al target como dado de baja previamente
        $db->table('users')->where('id', $this->targetUserId)->update([
            'estado_cuenta'    => 'baja',
            'deleted_at'       => $now,
            'baja_motivo'      => 'previo',
            'baja_por_user_id' => $this->adminUserId,
            'updated_at'       => $now,
        ]);

        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->targetUserId}/baja")
            ->withBody(json_encode(['motivo' => 'segundo intento']))
            ->controller(Usuarios::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('darBaja', $this->targetUserId);

        $response->assertStatus(409);
    }

    // ── Test 4: 200 + ofertas reactivadas al reactivar ──

    public function testReactivarRestauraOfertas(): void
    {
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Crear oferta del target en estado pausada por admin (simula post-baja)
        $ofertaId = $this->insertOfertaActiva($this->targetUserId);
        $db->table('ofertas')->where('id', $ofertaId)->update([
            'estado'            => 'pausada',
            'pausada_por_admin' => 1,
            'updated_at'        => $now,
        ]);

        // Marcar al target como dado de baja
        $db->table('users')->where('id', $this->targetUserId)->update([
            'estado_cuenta'    => 'baja',
            'deleted_at'       => $now,
            'baja_motivo'      => 'spam',
            'baja_por_user_id' => $this->adminUserId,
            'updated_at'       => $now,
        ]);

        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->targetUserId}/reactivar")
            ->controller(Usuarios::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('reactivar', $this->targetUserId);

        $response->assertStatus(200);

        $body = $this->decodeBody($response->response());
        $this->assertArrayHasKey('data', $body);
        $this->assertSame(1, (int) $body['data']['ofertas_reactivadas']);

        // Verificar que el usuario ya no está soft-deleted
        $user = $db->table('users')
            ->select('deleted_at, estado_cuenta, baja_motivo, baja_por_user_id')
            ->where('id', $this->targetUserId)
            ->get()
            ->getRowArray();
        $this->assertIsArray($user);
        $this->assertNull($user['deleted_at']);
        $this->assertSame('activa', $user['estado_cuenta']);
        $this->assertNull($user['baja_motivo']);
        $this->assertNull($user['baja_por_user_id']);

        // Verificar oferta reactivada
        $oferta = $db->table('ofertas')
            ->select('estado, pausada_por_admin')
            ->where('id', $ofertaId)
            ->get()
            ->getRowArray();
        $this->assertIsArray($oferta);
        $this->assertSame('activa', $oferta['estado']);
        $this->assertSame(0, (int) $oferta['pausada_por_admin']);
    }

    // ── Test 5: 409 si el usuario no está dado de baja ──

    public function testReactivarUsuarioNoEnBaja(): void
    {
        // Target ya está activo (deleted_at = null por defecto en setUp)
        $result = $this->withUri("http://localhost/api/v1/admin/usuarios/{$this->targetUserId}/reactivar")
            ->controller(Usuarios::class);

        $this->request->setHeader('X-Auth-UserId', (string) $this->adminUserId);

        $response = $result->execute('reactivar', $this->targetUserId);

        $response->assertStatus(409);
    }
}
