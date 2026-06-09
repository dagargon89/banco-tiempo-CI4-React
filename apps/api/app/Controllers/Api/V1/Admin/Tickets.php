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
