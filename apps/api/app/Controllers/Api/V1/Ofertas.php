<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

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

    /** GET /api/v1/ofertas — Exploración pública con filtros. */
    public function index(): ResponseInterface
    {
        $filtros = [
            'categoria_id' => $this->request->getGet('categoria_id'),
            'modalidad'    => $this->request->getGet('modalidad'),
            'zona'         => $this->request->getGet('zona'),
            'q'            => $this->request->getGet('q'),
        ];

        $page    = (int) ($this->request->getGet('page') ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 12);

        $result = $this->service->explorar($filtros, $page, $perPage);

        return $this->ok($result['items'], [
            'total'    => $result['total'],
            'page'     => max(1, $page),
            'per_page' => min(50, max(1, $perPage)),
        ]);
    }

    /** GET /api/v1/ofertas/{id} — Detalle de una oferta. */
    public function show(int $id): ResponseInterface
    {
        $oferta = $this->service->obtener($id);
        if ($oferta === null) {
            return $this->notFound('Oferta no encontrada.');
        }

        // Ocultar ofertas no-activas a no-dueños
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        if ($oferta['estado'] !== 'activa' && (int) $oferta['user_id'] !== $userId) {
            return $this->notFound('Oferta no encontrada.');
        }

        return $this->ok($oferta);
    }

    /** POST /api/v1/ofertas — Crear oferta (requiere auth). */
    public function create(): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();
        $datos  = $this->request->getJSON(true) ?? [];

        try {
            $oferta = $this->service->crear($userId, $datos, $ip);
            return $this->created($oferta);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->unprocessable(['validation' => $e->getMessage()]);
        }
    }

    /** PATCH /api/v1/ofertas/{id} — Actualizar oferta. */
    public function update(int $id): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles  = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $ip     = $this->request->getIPAddress();
        $datos  = $this->request->getJSON(true) ?? [];

        try {
            $oferta = $this->service->actualizar($id, $userId, $roles, $datos, $ip);
            return $this->ok($oferta);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->unprocessable(['validation' => $e->getMessage()]);
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /api/v1/ofertas/{id}/estado — Cambiar estado (máquina de estados). */
    public function cambiarEstado(int $id): ResponseInterface
    {
        $userId     = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles      = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $ip         = $this->request->getIPAddress();
        $data       = $this->request->getJSON(true) ?? [];
        $nuevoEstado = $data['estado'] ?? '';

        if (! in_array($nuevoEstado, ['activa', 'pausada', 'eliminada'], true)) {
            return $this->unprocessable(['estado' => 'Estado debe ser: activa, pausada o eliminada.']);
        }

        try {
            $oferta = $this->service->cambiarEstado($id, $userId, $roles, $nuevoEstado, $ip);
            return $this->ok($oferta);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
