<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Exceptions\ConflictException;
use App\Services\VinculacionService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Vinculaciones extends Controller
{
    use ApiResponder;

    private VinculacionService $service;

    public function __construct()
    {
        $this->service = new VinculacionService();
    }

    /** POST /api/v1/ofertas/{id}/interes */
    public function marcarInteres(int $ofertaId): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();

        try {
            $vinculacion = $this->service->marcarInteres($ofertaId, $userId, $ip);
            return $this->created($vinculacion);
        } catch (ConflictException $e) {
            return $this->conflict($e->getMessage());
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** GET /api/v1/vinculaciones */
    public function index(): ResponseInterface
    {
        $userId  = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles   = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));
        $estado  = $this->request->getGet('estado');
        $rol     = $this->request->getGet('rol');
        $page    = (int) ($this->request->getGet('page') ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 12);

        $result = $this->service->listar($userId, $roles, $estado, $rol, $page, $perPage);

        return $this->ok($result['items'], [
            'total'    => $result['total'],
            'page'     => max(1, $page),
            'per_page' => min(50, max(1, $perPage)),
        ]);
    }

    /** GET /api/v1/vinculaciones/{id} */
    public function show(int $id): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $roles  = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));

        try {
            $vinculacion = $this->service->obtener($id, $userId, $roles);
            return $this->ok($vinculacion);
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /api/v1/vinculaciones/{id}/aceptar */
    public function aceptar(int $id): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();

        try {
            $vinculacion = $this->service->aceptar($id, $userId, $ip);
            return $this->ok($vinculacion);
        } catch (ConflictException $e) {
            return $this->conflict($e->getMessage());
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /api/v1/vinculaciones/{id}/rechazar */
    public function rechazar(int $id): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();

        try {
            $vinculacion = $this->service->rechazar($id, $userId, $ip);
            return $this->ok($vinculacion);
        } catch (ConflictException $e) {
            return $this->conflict($e->getMessage());
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /api/v1/vinculaciones/{id}/cancelar */
    public function cancelar(int $id): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();

        try {
            $vinculacion = $this->service->cancelar($id, $userId, $ip);
            return $this->ok($vinculacion);
        } catch (ConflictException $e) {
            return $this->conflict($e->getMessage());
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /** PATCH /api/v1/vinculaciones/{id}/confirmar */
    public function confirmar(int $id): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip     = $this->request->getIPAddress();

        try {
            $vinculacion = $this->service->confirmar($id, $userId, $ip);
            return $this->ok($vinculacion);
        } catch (ConflictException $e) {
            return $this->conflict($e->getMessage());
        } catch (\DomainException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
