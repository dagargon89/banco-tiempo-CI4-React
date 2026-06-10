<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Controllers\Api\V1\Admin\Tickets;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\ControllerTestTrait;

/**
 * Feature tests para GET /admin/tickets/{id}.
 *
 * - Devuelve detalle del ticket con flag `creador_inactivo` cuando el
 *   creador tiene deleted_at no nulo, e incluye un arreglo `historial`.
 * - 404 si el ticket no existe.
 */
final class TicketsDetalleTest extends CIUnitTestCase
{
    use ControllerTestTrait;

    private int $creadorId   = 0;
    private int $adminUserId = 0;
    private int $ticketId    = 0;
    private string $suffix   = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->suffix = bin2hex(random_bytes(6));
        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        // Creador del ticket dado de baja (soft delete)
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-tkt-creador-{$this->suffix}",
            'nombre'              => 'Creador Baja',
            'email'               => "tkt-creador-{$this->suffix}@test.local",
            'estado_verificacion' => 'verificado',
            'estado_cuenta'       => 'baja',
            'deleted_at'          => $now,
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);
        $this->creadorId = (int) $db->insertID();

        // Admin con rol moderador
        $db->table('users')->insert([
            'firebase_uid'        => "test-uid-tkt-admin-{$this->suffix}",
            'nombre'              => 'Admin Tickets',
            'email'               => "tkt-admin-{$this->suffix}@test.local",
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

        // Ticket abierto creado por el usuario dado de baja
        $folio = 'TK-TEST-' . strtoupper(substr($this->suffix, 0, 8));
        $db->table('tickets')->insert([
            'folio'        => $folio,
            'creador_id'   => $this->creadorId,
            'tipo'         => 'reporte',
            'entidad_tipo' => 'otro',
            'entidad_id'   => null,
            'estado'       => 'abierto',
            'descripcion'  => 'Descripción de ticket de prueba para test de detalle.',
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);
        $this->ticketId = (int) $db->insertID();
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect();

        if ($this->ticketId > 0) {
            $db->table('ticket_asignaciones')->where('ticket_id', $this->ticketId)->delete();
            $db->table('auditoria')
                ->where('entidad_tipo', 'tickets')
                ->where('entidad_id', $this->ticketId)
                ->delete();
            $db->table('tickets')->where('id', $this->ticketId)->delete();
        }

        $userIds = array_filter([$this->creadorId, $this->adminUserId], static fn (int $id): bool => $id > 0);
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

    // ── Test 1: show con flag creador_inactivo e historial ──

    public function testShowReturnsTicketWithCreadorInactivoFlag(): void
    {
        $result = $this->withUri("http://localhost/api/v1/admin/tickets/{$this->ticketId}")
            ->controller(Tickets::class)
            ->execute('show', $this->ticketId);

        $result->assertStatus(200);

        $body = $this->decodeBody($result->response());
        $this->assertArrayHasKey('data', $body);
        $data = $body['data'];

        $this->assertSame($this->ticketId, (int) $data['id']);
        $this->assertArrayHasKey('creador_inactivo', $data);
        $this->assertTrue((bool) $data['creador_inactivo'], 'creador_inactivo debe ser truthy.');
        $this->assertArrayHasKey('creador_nombre', $data);
        $this->assertNotEmpty($data['creador_nombre']);
        $this->assertArrayHasKey('historial', $data);
        $this->assertIsArray($data['historial']);
    }

    // ── Test 2: 404 si el ticket no existe ──

    public function testShowReturns404WhenTicketNotFound(): void
    {
        $db     = \Config\Database::connect();
        $exists = $db->table('tickets')->where('id', 999999)->countAllResults();
        $this->assertSame(0, $exists, 'El ticket id=999999 debe no existir para test de isolation.');

        $result = $this->withUri('http://localhost/api/v1/admin/tickets/999999')
            ->controller(Tickets::class)
            ->execute('show', 999999);

        $result->assertStatus(404);
    }
}
