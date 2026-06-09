<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Exceptions\ConflictException;
use App\Services\VinculacionService;
use App\Services\OfertaService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Tests de integración para vinculaciones con BD real.
 */
final class VinculacionesCrudIntegrationTest extends CIUnitTestCase
{
    private int $oferenteId    = 0;
    private int $buscadorId    = 0;
    private int $categoriaId   = 0;
    private int $ofertaId      = 0;
    private string $testSuffix = '';
    private array $extraUserIds     = [];
    private array $createdVincIds   = [];
    private array $createdOfertaIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->testSuffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: oferente verificado
        $db->table('users')->insert([
            'firebase_uid'        => "vinc-oferente-{$this->testSuffix}",
            'nombre'              => 'Oferente Test',
            'email'               => "oferente-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->oferenteId = (int) $db->insertID();

        // Seed: buscador verificado
        $db->table('users')->insert([
            'firebase_uid'        => "vinc-buscador-{$this->testSuffix}",
            'nombre'              => 'Buscador Test',
            'email'               => "buscador-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->buscadorId = (int) $db->insertID();

        // Seed: categoría
        $db->table('categorias')->insert([
            'nombre' => "VincCat {$this->testSuffix}",
            'slug'   => "vinc-cat-{$this->testSuffix}",
            'activa' => 1,
        ]);
        $this->categoriaId = (int) $db->insertID();

        // Seed: oferta activa del oferente
        $ofertaService = new OfertaService();
        $oferta = $ofertaService->crear($this->oferenteId, [
            'titulo'               => 'Clases de guitarra para vinculacion test',
            'categoria_id'         => $this->categoriaId,
            'descripcion_breve'    => 'Aprende acordes basicos en cuatro sesiones de una hora aqui.',
            'descripcion_completa' => 'Detalle completo de las clases de guitarra.',
            'modalidad'            => 'virtual',
        ], '127.0.0.1');
        $this->ofertaId = (int) $oferta['id'];
        $this->createdOfertaIds[] = $this->ofertaId;
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        // Limpiar conversaciones y vinculaciones
        foreach ($this->createdVincIds as $id) {
            $db->table('conversaciones')->where('vinculacion_id', $id)->delete();
            $db->table('vinculaciones')->where('id', $id)->delete();
        }

        // Limpiar ofertas
        foreach ($this->createdOfertaIds as $id) {
            $db->table('vinculaciones')->where('oferta_id', $id)->delete();
            $db->table('oferta_imagenes')->where('oferta_id', $id)->delete();
            $db->table('ofertas')->where('id', $id)->delete();
        }

        // Limpiar auditoría y usuarios
        $allUserIds = array_merge([$this->oferenteId, $this->buscadorId], $this->extraUserIds);
        if ($allUserIds !== []) {
            $db->table('auditoria')->whereIn('actor_id', $allUserIds)->delete();
            $db->table('users')->whereIn('id', $allUserIds)->delete();
        }

        if ($this->categoriaId > 0) {
            $db->table('categorias')->where('id', $this->categoriaId)->delete();
        }

        $this->createdVincIds   = [];
        $this->createdOfertaIds = [];
        $this->extraUserIds     = [];

        parent::tearDown();
    }

    // ── 1. Buscador marca interés → 201, estado solicitada ──

    public function testMarcarInteresCreaSolicitada(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $this->createdVincIds[] = (int) $vinc['id'];

        $this->assertSame('solicitada', $vinc['estado']);
        $this->assertSame($this->buscadorId, (int) $vinc['buscador_id']);
    }

    // ── 2. Segundo interés en misma oferta → ConflictException ──

    public function testSegundoInteresMismaOfertaLanzaConflict(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $this->createdVincIds[] = (int) $vinc['id'];

        $this->expectException(ConflictException::class);
        $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
    }

    // ── 3. Oferente acepta → aceptada, conversación creada ──

    public function testOferenteAceptaCreaConversacion(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $aceptada = $service->aceptar($vincId, $this->oferenteId, '127.0.0.1');
        $this->assertSame('aceptada', $aceptada['estado']);

        // Verificar conversación creada
        $db = \Config\Database::connect();
        $conv = $db->table('conversaciones')->where('vinculacion_id', $vincId)->get()->getRowArray();
        $this->assertNotNull($conv);
        $this->assertSame('habilitada', $conv['estado']);
    }

    // ── 4. Aceptar una rechazada → ConflictException ──

    public function testAceptarRechazadaLanzaConflict(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $service->rechazar($vincId, $this->oferenteId, '127.0.0.1');

        $this->expectException(ConflictException::class);
        $service->aceptar($vincId, $this->oferenteId, '127.0.0.1');
    }

    // ── 5. Completar sin estar aceptada → falla ──

    public function testConfirmarSinAceptarLanzaExcepcion(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $this->expectException(\DomainException::class);
        $service->confirmar($vincId, $this->oferenteId, '127.0.0.1');
    }

    // ── 6. Una parte confirma → sigue aceptada ──

    public function testUnaConfirmacionSigueAceptada(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $service->aceptar($vincId, $this->oferenteId, '127.0.0.1');
        $confirmada = $service->confirmar($vincId, $this->oferenteId, '127.0.0.1');

        $this->assertSame('aceptada', $confirmada['estado']);
    }

    // ── 7. Ambas partes confirman → completada ──

    public function testDobleConfirmacionCompleta(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $service->aceptar($vincId, $this->oferenteId, '127.0.0.1');
        $service->confirmar($vincId, $this->oferenteId, '127.0.0.1');
        $completada = $service->confirmar($vincId, $this->buscadorId, '127.0.0.1');

        $this->assertSame('completada', $completada['estado']);
        $this->assertNotNull($completada['completada_at']);
    }

    // ── 8. Cancelar después de aceptar ──

    public function testCancelarDespuesDeAceptar(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $service->aceptar($vincId, $this->oferenteId, '127.0.0.1');
        $cancelada = $service->cancelar($vincId, $this->buscadorId, '127.0.0.1');

        $this->assertSame('cancelada', $cancelada['estado']);
        $this->assertSame($this->buscadorId, (int) $cancelada['cancelada_por']);
    }

    // ── 9. Autovinculación prohibida ──

    public function testAutovinculacionProhibida(): void
    {
        $service = new VinculacionService();
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('propia oferta');
        $service->marcarInteres($this->ofertaId, $this->oferenteId, '127.0.0.1');
    }

    // ── 10. Usuario no verificado no puede marcar interés ──

    public function testNoVerificadoNoPuedeMarcarInteres(): void
    {
        $db = \Config\Database::connect();
        $db->table('users')->insert([
            'firebase_uid'        => "vinc-noverif-{$this->testSuffix}",
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

        $service = new VinculacionService();
        $service->marcarInteres($this->ofertaId, $noVerifId, '127.0.0.1');
    }

    // ── 11. Buscador no puede aceptar ──

    public function testBuscadorNoPuedeAceptar(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $this->expectException(\DomainException::class);
        $service->aceptar($vincId, $this->buscadorId, '127.0.0.1');
    }

    // ── 12. Confirmar dos veces por la misma parte → ConflictException ──

    public function testDobleConfirmacionMismaParteLanzaConflict(): void
    {
        $service = new VinculacionService();
        $vinc = $service->marcarInteres($this->ofertaId, $this->buscadorId, '127.0.0.1');
        $vincId = (int) $vinc['id'];
        $this->createdVincIds[] = $vincId;

        $service->aceptar($vincId, $this->oferenteId, '127.0.0.1');
        $service->confirmar($vincId, $this->oferenteId, '127.0.0.1');

        $this->expectException(ConflictException::class);
        $service->confirmar($vincId, $this->oferenteId, '127.0.0.1');
    }
}
