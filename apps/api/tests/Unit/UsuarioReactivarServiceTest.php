<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\UsuarioReactivarService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests del servicio UsuarioReactivarService (admin → reactivar usuario en baja).
 *
 * Cubre:
 * - Happy path: reactiva solo ofertas pausadas por admin, limpia soft delete, audita.
 * - Rechaza si el usuario no está dado de baja.
 * - Auditoría registrada correctamente.
 */
final class UsuarioReactivarServiceTest extends CIUnitTestCase
{
    private int $targetUserId    = 0;
    private int $adminUserId     = 0;
    private int $testCategoriaId = 0;
    private string $suffix       = '';
    /** @var list<int> */
    private array $createdOfertaIds = [];
    /** @var list<int> */
    private array $extraUserIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: usuario target (será reactivado)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-react-target-{$this->suffix}",
            'nombre'              => 'Target User',
            'email'               => "target-react-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->targetUserId = (int) $db->insertID();

        // Seed: usuario admin
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-react-admin-{$this->suffix}",
            'nombre'              => 'Admin User',
            'email'               => "admin-react-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->adminUserId = (int) $db->insertID();

        // Seed: categoría
        $db->table('categorias')->insert([
            'nombre' => "TestCatReact {$this->suffix}",
            'slug'   => "test-react-{$this->suffix}",
            'activa' => 1,
        ]);
        $this->testCategoriaId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        foreach ($this->createdOfertaIds as $id) {
            $db->table('oferta_imagenes')->where('oferta_id', $id)->delete();
            $db->table('ofertas')->where('id', $id)->delete();
        }

        $allUserIds = array_merge([$this->targetUserId, $this->adminUserId], $this->extraUserIds);
        if ($allUserIds !== []) {
            $db->table('auditoria')->whereIn('actor_id', $allUserIds)->delete();
            $db->table('auditoria')->whereIn('entidad_id', $allUserIds)->where('entidad_tipo', 'user')->delete();
        }

        if ($this->testCategoriaId > 0) {
            $db->table('categorias')->where('id', $this->testCategoriaId)->delete();
        }
        if ($allUserIds !== []) {
            // Hard delete (saltar soft delete) para limpiar
            $db->table('users')->whereIn('id', $allUserIds)->delete();
        }

        $this->createdOfertaIds = [];
        $this->extraUserIds     = [];

        parent::tearDown();
    }

    /** Marca al usuario target como dado de baja directamente vía query. */
    private function marcarUsuarioEnBaja(string $motivo = 'test'): void
    {
        $db = \Config\Database::connect();
        $db->table('users')->where('id', $this->targetUserId)->update([
            'estado_cuenta'    => 'baja',
            'deleted_at'       => date('Y-m-d H:i:s'),
            'baja_motivo'      => $motivo,
            'baja_por_user_id' => $this->adminUserId,
            'updated_at'       => date('Y-m-d H:i:s'),
        ]);
    }

    /** Inserta una oferta con un estado dado y opcionalmente pausada_por_admin. */
    private function insertarOferta(int $userId, string $estado, int $pausadaPorAdmin = 0): int
    {
        $db = \Config\Database::connect();
        $db->table('ofertas')->insert([
            'user_id'              => $userId,
            'categoria_id'         => $this->testCategoriaId,
            'titulo'               => "Oferta {$estado} {$this->suffix} " . bin2hex(random_bytes(3)),
            'descripcion_breve'    => 'Descripción breve de prueba para test de reactivación de usuario.',
            'descripcion_completa' => 'Descripción completa de prueba para test de reactivación.',
            'modalidad'            => 'virtual',
            'estado'               => $estado,
            'pausada_por_admin'    => $pausadaPorAdmin,
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);
        $id = (int) $db->insertID();
        $this->createdOfertaIds[] = $id;
        return $id;
    }

    // ── Happy path ──

    public function testReactivarReactivaSoloOfertasPausadasPorAdmin(): void
    {
        $this->marcarUsuarioEnBaja('motivo previo');

        // Oferta pausada por admin (será reactivada)
        $ofertaAdmin = $this->insertarOferta($this->targetUserId, 'pausada', 1);
        // Oferta pausada manualmente (NO se reactiva)
        $ofertaManual = $this->insertarOferta($this->targetUserId, 'pausada', 0);

        $service = new UsuarioReactivarService();
        $resultado = $service->reactivar($this->targetUserId, $this->adminUserId);

        // Resultado
        $this->assertSame(1, $resultado['ofertas_reactivadas']);

        // Verificar estado del usuario
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('id', $this->targetUserId)->get()->getRowArray();
        $this->assertNotNull($user, 'El usuario debe existir.');
        $this->assertSame('activa', $user['estado_cuenta']);
        $this->assertNull($user['deleted_at']);
        $this->assertNull($user['baja_motivo']);
        $this->assertNull($user['baja_por_user_id']);

        // Verificar ofertas
        $oAdmin = $db->table('ofertas')->where('id', $ofertaAdmin)->get()->getRowArray();
        $oManual = $db->table('ofertas')->where('id', $ofertaManual)->get()->getRowArray();

        $this->assertSame('activa', $oAdmin['estado']);
        $this->assertSame(0, (int) $oAdmin['pausada_por_admin']);

        // La pausada manualmente sigue pausada
        $this->assertSame('pausada', $oManual['estado']);
        $this->assertSame(0, (int) $oManual['pausada_por_admin']);

        // Exactamente 1 oferta activa de este usuario
        $activas = $db->table('ofertas')
            ->where('user_id', $this->targetUserId)
            ->where('estado', 'activa')
            ->countAllResults();
        $this->assertSame(1, $activas);
    }

    // ── Rechaza usuario no en baja ──

    public function testRechazaUsuarioNoEnBaja(): void
    {
        // El target está 'activa' y deleted_at=null (estado inicial del setUp).
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('no está dado de baja');

        $service = new UsuarioReactivarService();
        $service->reactivar($this->targetUserId, $this->adminUserId);
    }

    // ── Auditoría ──

    public function testRegistraEntradaDeAuditoria(): void
    {
        $this->marcarUsuarioEnBaja('motivo previo');
        // Agregamos 1 oferta pausada por admin para que el count sea verificable
        $this->insertarOferta($this->targetUserId, 'pausada', 1);

        $service = new UsuarioReactivarService();
        $service->reactivar($this->targetUserId, $this->adminUserId);

        $db = \Config\Database::connect();
        $rows = $db->table('auditoria')
            ->where('accion', 'admin_reactivar_usuario')
            ->where('entidad_tipo', 'user')
            ->where('entidad_id', $this->targetUserId)
            ->where('actor_id', $this->adminUserId)
            ->get()
            ->getResultArray();

        $this->assertCount(1, $rows, 'Debe existir exactamente una entrada de auditoría.');
        $this->assertNotNull($rows[0]['metadata']);
        $metadata = json_decode((string) $rows[0]['metadata'], true);
        $this->assertIsArray($metadata);
        $this->assertArrayHasKey('ofertas_reactivadas', $metadata);
        $this->assertSame(1, (int) $metadata['ofertas_reactivadas']);
    }
}
