<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Services\OfertaService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Ofertas extends Controller
{
    use ApiResponder;

    private OfertaService $service;

    public function __construct()
    {
        $this->service = new OfertaService();
    }

    /** GET /admin/ofertas — Listado de ofertas para moderadores. */
    public function index(): ResponseInterface
    {
        $filtros = [
            'estado'       => $this->request->getGet('estado'),
            'categoria_id' => $this->request->getGet('categoria_id'),
            'q'            => $this->request->getGet('q'),
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

    /** PATCH /admin/ofertas/{id}/despublicar — Despublicar oferta activa. */
    public function despublicar(int $id): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip          = $this->request->getIPAddress();

        try {
            $oferta = $this->service->despublicar($id, $moderadorId, $ip);
            return $this->ok($oferta);
        } catch (\DomainException $e) {
            return $this->conflict($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
