<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\TicketService;
use CodeIgniter\Test\CIUnitTestCase;

final class TicketsCrudTest extends CIUnitTestCase
{
    private TicketService $service;

    private int $creadorId    = 0;
    private int $moderadorId  = 0;
    private string $testSuffix = '';
    private array $createdTicketIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->service    = new TicketService();
        $this->testSuffix = bin2hex(random_bytes(6));
        $db = \Config\Database::connect();

        // Seed: creador
        $db->table('users')->insert([
            'firebase_uid'        => "tk-creador-{$this->testSuffix}",
            'nombre'              => 'Creador Ticket',
            'email'               => "tk-creador-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->creadorId = (int) $db->insertID();

        // Seed: moderador
        $db->table('users')->insert([
            'firebase_uid'        => "tk-mod-{$this->testSuffix}",
            'nombre'              => 'Moderador Ticket',
            'email'               => "tk-mod-{$this->testSuffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'activa',
            'created_at'          => date('Y-m-d H:i:s'),
            'updated_at'          => date('Y-m-d H:i:s'),
        ]);
        $this->moderadorId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        // Limpiar asignaciones y tickets
        foreach ($this->createdTicketIds as $id) {
            $db->table('ticket_asignaciones')->where('ticket_id', $id)->delete();
            $db->table('tickets')->where('id', $id)->delete();
        }

        // Limpiar auditoría y usuarios
        $userIds = [$this->creadorId, $this->moderadorId];
        $db->table('auditoria')->whereIn('actor_id', $userIds)->delete();
        $db->table('users')->whereIn('id', $userIds)->delete();

        parent::tearDown();
    }

    /** Crear ticket → folio con formato TK-YYYY-NNNNNN */
    public function testCrearTicketConFolio(): void
    {
        $ticket = $this->service->crear($this->creadorId, [
            'tipo'         => 'reporte',
            'descripcion'  => 'Este es un reporte de prueba para el test de integración.',
            'entidad_tipo' => 'usuario',
            'entidad_id'   => 42,
        ], '127.0.0.1');
        $this->createdTicketIds[] = (int) $ticket['id'];

        $this->assertNotNull($ticket);
        $this->assertMatchesRegularExpression('/^TK-\d{4}-\d{6}$/', $ticket['folio']);
        $this->assertEquals('abierto', $ticket['estado']);
        $this->assertEquals('reporte', $ticket['tipo']);
        $this->assertEquals($this->creadorId, (int) $ticket['creador_id']);
    }

    /** Mis tickets → solo del creador */
    public function testMisTicketsSoloDelCreador(): void
    {
        $ticket = $this->service->crear($this->creadorId, [
            'tipo'        => 'sugerencia',
            'descripcion' => 'Sugerencia de prueba con suficientes caracteres.',
        ], '127.0.0.1');
        $this->createdTicketIds[] = (int) $ticket['id'];

        $result = $this->service->misTickets($this->creadorId, 1, 20);
        $this->assertArrayHasKey('items', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertGreaterThanOrEqual(1, $result['total']);

        // Moderador no debe ver tickets del creador
        $resultMod = $this->service->misTickets($this->moderadorId, 1, 20);
        $ids = array_column($resultMod['items'], 'id');
        $this->assertNotContains($ticket['id'], $ids);
    }

    /** Asignar ticket → estado pasa a en_proceso */
    public function testAsignarTicketCambiaEstado(): void
    {
        $ticket = $this->service->crear($this->creadorId, [
            'tipo'        => 'reporte',
            'descripcion' => 'Reporte para asignar en test de integración.',
        ], '127.0.0.1');
        $this->createdTicketIds[] = (int) $ticket['id'];

        $updated = $this->service->asignar(
            (int) $ticket['id'],
            $this->moderadorId,
            ['moderador'],
            '127.0.0.1',
        );

        $this->assertEquals('en_proceso', $updated['estado']);
        $this->assertArrayHasKey('asignaciones', $updated);
        $this->assertNotEmpty($updated['asignaciones']);
    }

    /** Cambiar estado a resuelto con resolución */
    public function testCambiarEstadoResueltoConResolucion(): void
    {
        $ticket = $this->service->crear($this->creadorId, [
            'tipo'        => 'reporte',
            'descripcion' => 'Reporte para resolver en test de integración.',
        ], '127.0.0.1');
        $this->createdTicketIds[] = (int) $ticket['id'];

        // Asignar primero (abierto → en_proceso)
        $this->service->asignar((int) $ticket['id'], $this->moderadorId, ['moderador'], '127.0.0.1');

        // Resolver (en_proceso → resuelto)
        $resuelto = $this->service->cambiarEstado(
            (int) $ticket['id'],
            $this->moderadorId,
            ['moderador'],
            'resuelto',
            'Se resolvió el problema reportado.',
            '127.0.0.1',
        );

        $this->assertEquals('resuelto', $resuelto['estado']);
        $this->assertEquals('Se resolvió el problema reportado.', $resuelto['resolucion']);
    }

    /** Transición inválida → DomainException */
    public function testTransicionInvalidaLanzaExcepcion(): void
    {
        $ticket = $this->service->crear($this->creadorId, [
            'tipo'        => 'reporte',
            'descripcion' => 'Reporte para test de transición inválida.',
        ], '127.0.0.1');
        $this->createdTicketIds[] = (int) $ticket['id'];

        // abierto → resuelto no es válido
        $this->expectException(\DomainException::class);
        $this->service->cambiarEstado(
            (int) $ticket['id'],
            $this->moderadorId,
            ['moderador'],
            'resuelto',
            'Resolución',
            '127.0.0.1',
        );
    }

    /** Resolución obligatoria para estado resuelto */
    public function testResolucionObligatoriaParaResuelto(): void
    {
        $ticket = $this->service->crear($this->creadorId, [
            'tipo'        => 'reporte',
            'descripcion' => 'Reporte para test sin resolución obligatoria.',
        ], '127.0.0.1');
        $this->createdTicketIds[] = (int) $ticket['id'];

        $this->service->asignar((int) $ticket['id'], $this->moderadorId, ['moderador'], '127.0.0.1');

        $this->expectException(\InvalidArgumentException::class);
        $this->service->cambiarEstado(
            (int) $ticket['id'],
            $this->moderadorId,
            ['moderador'],
            'resuelto',
            '',
            '127.0.0.1',
        );
    }
}
