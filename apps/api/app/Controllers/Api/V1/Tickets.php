<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

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

    /** POST /tickets */
    public function create(): ResponseInterface
    {
        $creadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip        = $this->request->getIPAddress();
        $datos     = $this->request->getJSON(true) ?? [];

        try {
            $ticket = $this->service->crear($creadorId, $datos, $ip);
            return $this->created($ticket);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->unprocessable(['general' => $e->getMessage()]);
        }
    }

    /** GET /tickets/mios */
    public function mios(): ResponseInterface
    {
        $userId  = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $page    = (int) ($this->request->getGet('page') ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 20);

        $result = $this->service->misTickets($userId, $page, $perPage);

        return $this->ok($result['items'], [
            'total'    => $result['total'],
            'page'     => max(1, $page),
            'per_page' => min(50, max(1, $perPage)),
        ]);
    }
}
