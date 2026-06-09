<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Services\ResenaService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Resenas extends Controller
{
    use ApiResponder;

    private ResenaService $service;

    public function __construct()
    {
        $this->service = new ResenaService();
    }

    /** PATCH /admin/resenas/{id}/ocultar */
    public function ocultar(int $resenaId): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles       = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $ip          = $this->request->getIPAddress();

        try {
            $this->service->ocultar($resenaId, $moderadorId, $roles, $ip);
            return $this->ok(['message' => 'Reseña ocultada correctamente.']);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
