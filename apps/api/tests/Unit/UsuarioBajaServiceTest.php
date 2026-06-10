<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\UserModel;
use App\Services\UsuarioBajaService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests del servicio UsuarioBajaService (admin → dar baja a un usuario).
 *
 * Cubre:
 * - Happy path: pausa cascada de ofertas activas, marca user baja, audita.
 * - Auto-baja rechazada.
 * - Usuario ya dado de baja rechazado.
 */
final class UsuarioBajaServiceTest extends CIUnitTestCase
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

        // Seed: usuario target (será dado de baja)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-baja-target-{$this->suffix}",
            'nombre'              => 'Target User',
            'email'               => "target-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->targetUserId = (int) $db->insertID();

        // Seed: usuario admin
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-baja-admin-{$this->suffix}",
            'nombre'              => 'Admin User',
            'email'               => "admin-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->adminUserId = (int) $db->insertID();

        // Seed: categoría
        $db->table('categorias')->insert([
            'nombre' => "TestCatBaja {$this->suffix}",
            'slug'   => "test-baja-{$this->suffix}",
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

    /** Inserta una oferta con un estado dado y opcionalmente pausada_por_admin. */
    private function insertarOferta(int $userId, string $estado, int $pausadaPorAdmin = 0): int
    {
        $db = \Config\Database::connect();
        $db->table('ofertas')->insert([
            'user_id'              => $userId,
            'categoria_id'         => $this->testCategoriaId,
            'titulo'               => "Oferta {$estado} {$this->suffix} " . bin2hex(random_bytes(3)),
            'descripcion_breve'    => 'Descripción breve de prueba para test de baja en cascada de usuario.',
            'descripcion_completa' => 'Descripción completa de prueba para test de baja en cascada.',
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

    public function testDarBajaPausaOfertasActivasYMarcaUsuario(): void
    {
        // 2 ofertas activas + 1 pausada manualmente
        $ofertaActiva1 = $this->insertarOferta($this->targetUserId, 'activa', 0);
        $ofertaActiva2 = $this->insertarOferta($this->targetUserId, 'activa', 0);
        $ofertaPausadaManual = $this->insertarOferta($this->targetUserId, 'pausada', 0);

        $service = new UsuarioBajaService(skipFirebase: true);
        $resultado = $service->darBaja($this->targetUserId, 'motivo de prueba', $this->adminUserId);

        // Resultado
        $this->assertSame(2, $resultado['ofertas_pausadas']);

        // Verificar estado de usuario
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('id', $this->targetUserId)->get()->getRowArray();
        $this->assertNotNull($user, 'El usuario debe existir.');
        $this->assertSame('baja', $user['estado_cuenta']);
        $this->assertNotNull($user['deleted_at']);
        $this->assertSame('motivo de prueba', $user['baja_motivo']);
        $this->assertSame($this->adminUserId, (int) $user['baja_por_user_id']);

        // Verificar ofertas: las 2 activas ahora son pausadas con pausada_por_admin=1
        $o1 = $db->table('ofertas')->where('id', $ofertaActiva1)->get()->getRowArray();
        $o2 = $db->table('ofertas')->where('id', $ofertaActiva2)->get()->getRowArray();
        $oManual = $db->table('ofertas')->where('id', $ofertaPausadaManual)->get()->getRowArray();

        $this->assertSame('pausada', $o1['estado']);
        $this->assertSame(1, (int) $o1['pausada_por_admin']);

        $this->assertSame('pausada', $o2['estado']);
        $this->assertSame(1, (int) $o2['pausada_por_admin']);

        // La que ya estaba pausada manualmente no cambia
        $this->assertSame('pausada', $oManual['estado']);
        $this->assertSame(0, (int) $oManual['pausada_por_admin']);
    }

    // ── Auto-baja rechazada ──

    public function testNoPuedeDarseBajaASiMismo(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('No puedes darte baja');

        $service = new UsuarioBajaService(skipFirebase: true);
        $service->darBaja($this->targetUserId, 'intento auto-baja', $this->targetUserId);
    }

    // ── Ya dado de baja ──

    public function testUsuarioYaDadoDeBajaLanzaExcepcion(): void
    {
        // Marcar al target como ya dado de baja
        $db = \Config\Database::connect();
        $db->table('users')->where('id', $this->targetUserId)->update([
            'estado_cuenta' => 'baja',
            'deleted_at'    => date('Y-m-d H:i:s'),
            'baja_motivo'   => 'baja previa',
            'baja_por_user_id' => $this->adminUserId,
        ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('ya está dado de baja');

        $service = new UsuarioBajaService(skipFirebase: true);
        $service->darBaja($this->targetUserId, 'segunda baja', $this->adminUserId);
    }
}
