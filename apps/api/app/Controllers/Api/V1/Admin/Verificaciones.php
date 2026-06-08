<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Services\VerificacionService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Endpoints de administración de verificaciones (moderadores).
 */
final class Verificaciones extends Controller
{
    use ApiResponder;

    private VerificacionService $service;

    public function __construct()
    {
        $this->service = new VerificacionService();
    }

    /** GET /admin/verificaciones — Lista documentos pendientes. */
    public function index(): ResponseInterface
    {
        $pendientes = $this->service->listarPendientes();
        return $this->ok($pendientes);
    }

    /** GET /admin/verificaciones/{id}/documento — Genera URL firmada. */
    public function documento(int $id): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles       = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $ip          = $this->request->getIPAddress();

        try {
            $result = $this->service->obtenerUrlDocumento($id, $moderadorId, $roles, $ip);
            return $this->ok($result);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /admin/verificaciones/{id} — Aprobar o rechazar. */
    public function resolver(int $id): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip          = $this->request->getIPAddress();
        $data        = $this->request->getJSON(true) ?? [];

        $accion = $data['accion'] ?? '';
        $motivo = $data['motivo'] ?? null;

        if (! in_array($accion, ['aprobar', 'rechazar'], true)) {
            return $this->unprocessable(['accion' => 'Debe ser "aprobar" o "rechazar".']);
        }

        try {
            // $id aquí es el user_id del usuario a resolver
            $result = $this->service->resolver($id, $moderadorId, $accion, $motivo, $ip);
            return $this->ok($result);
        } catch (\DomainException $e) {
            return $this->conflict($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->unprocessable(['validation' => $e->getMessage()]);
        }
    }
}
