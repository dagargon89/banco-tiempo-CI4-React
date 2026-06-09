<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Exceptions\ConflictException;
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

    /** POST /api/v1/vinculaciones/{id}/resena */
    public function create(int $vinculacionId): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();
        $datos  = $this->request->getJSON(true) ?? [];

        if (empty($datos['calificacion'])) {
            return $this->unprocessable(['calificacion' => 'La calificación es obligatoria.']);
        }

        $cal = (int) $datos['calificacion'];
        if ($cal < 1 || $cal > 5) {
            return $this->unprocessable(['calificacion' => 'La calificación debe ser entre 1 y 5.']);
        }

        try {
            $resena = $this->service->crear($vinculacionId, $userId, $datos, $ip);
            return $this->created($resena);
        } catch (ConflictException $e) {
            return $this->conflict($e->getMessage());
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** GET /api/v1/usuarios/{id}/resenas (público) */
    public function deUsuario(int $userId): ResponseInterface
    {
        $page    = (int) ($this->request->getGet('page') ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 10);

        $result = $this->service->deUsuario($userId, $page, $perPage);

        return $this->ok($result['items'], [
            'total'        => $result['total'],
            'page'         => max(1, $page),
            'per_page'     => min(50, max(1, $perPage)),
            'estadisticas' => $result['estadisticas'],
        ]);
    }

    /** POST /api/v1/resenas/{id}/reportar */
    public function reportar(int $resenaId): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();

        try {
            $this->service->reportar($resenaId, $userId, $ip);
            return $this->ok(['message' => 'Reseña reportada correctamente.']);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
