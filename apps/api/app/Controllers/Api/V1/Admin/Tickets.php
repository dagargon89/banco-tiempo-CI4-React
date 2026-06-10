<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Services\TicketService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Tickets extends Controller
{
    use ApiResponder;

    private TicketService $service;

    public function __construct()
    {
        $this->service = new TicketService();
    }

    /** GET /admin/tickets/{id} — Detalle de ticket con flag creador_inactivo e historial de auditoría. */
    public function show(int $id): ResponseInterface
    {
        $db     = \Config\Database::connect();
        $ticket = $db->table('tickets t')
            ->select('t.*, c.nombre AS creador_nombre, c.foto_perfil AS creador_foto, (c.deleted_at IS NOT NULL) AS creador_inactivo, um.nombre AS asignado_a_nombre, last_asig.moderador_id AS asignado_a')
            ->join('users c', 'c.id = t.creador_id', 'left')
            ->join(
                "(SELECT ta1.ticket_id, ta1.moderador_id FROM ticket_asignaciones ta1
                  INNER JOIN (SELECT ticket_id, MAX(id) AS max_id FROM ticket_asignaciones GROUP BY ticket_id) ta2
                  ON ta1.id = ta2.max_id) last_asig",
                'last_asig.ticket_id = t.id',
                'left'
            )
            ->join('users um', 'um.id = last_asig.moderador_id', 'left')
            ->where('t.id', $id)
            ->get()
            ->getRowArray();

        if ($ticket === null) {
            return $this->notFound('Ticket no encontrado.');
        }

        // Historial de cambios desde auditoría (entidad_tipo = 'tickets').
        $historial = $db->table('auditoria')
            ->select('actor_id, accion, metadata, created_at')
            ->where('entidad_tipo', 'tickets')
            ->where('entidad_id', $id)
            ->orderBy('created_at', 'ASC')
            ->get()
            ->getResultArray();

        $ticket['creador_inactivo'] = (int) $ticket['creador_inactivo'] === 1;
        $ticket['historial']        = $historial;

        return $this->ok($ticket);
    }

    /** GET /admin/tickets */
    public function index(): ResponseInterface
    {
        $filtros = [
            'tipo'   => $this->request->getGet('tipo'),
            'estado' => $this->request->getGet('estado'),
            'q'      => $this->request->getGet('q'),
        ];

        $page    = (int) ($this->request->getGet('page') ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 20);

        $result = $this->service->listarAdmin($filtros, $page, $perPage);

        return $this->ok($result['items'], [
            'total'    => $result['total'],
            'page'     => max(1, $page),
            'per_page' => min(50, max(1, $perPage)),
        ]);
    }

    /** PATCH /admin/tickets/{id}/asignar */
    public function asignar(int $id): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles       = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $ip          = $this->request->getIPAddress();

        try {
            $ticket = $this->service->asignar($id, $moderadorId, $roles, $ip);
            return $this->ok($ticket);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /admin/tickets/{id}/estado */
    public function cambiarEstado(int $id): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles       = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $ip          = $this->request->getIPAddress();
        $body        = $this->request->getJSON(true) ?? [];

        $nuevoEstado = $body['estado'] ?? '';
        $resolucion  = $body['resolucion'] ?? null;

        try {
            $ticket = $this->service->cambiarEstado($id, $moderadorId, $roles, $nuevoEstado, $resolucion, $ip);
            return $this->ok($ticket);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->unprocessable(['general' => $e->getMessage()]);
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
