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

    /** GET /admin/ofertas/{id} — Detalle de oferta para moderadores. */
    public function show(int $id): ResponseInterface
    {
        $db     = \Config\Database::connect();
        $oferta = $db->table('ofertas o')
            ->select('o.*, u.id AS user_id, u.nombre AS oferente_nombre, u.foto_perfil AS oferente_foto, (u.deleted_at IS NOT NULL) AS oferente_inactivo')
            ->join('users u', 'u.id = o.user_id', 'left')
            ->where('o.id', $id)
            ->get()
            ->getRowArray();

        if ($oferta === null) {
            return $this->notFound('Oferta no encontrada.');
        }

        $imagenes  = $db->table('oferta_imagenes')
            ->where('oferta_id', $id)
            ->orderBy('orden', 'ASC')
            ->get()
            ->getResultArray();
        $vincCount = $db->table('vinculaciones')->where('oferta_id', $id)->countAllResults();

        $oferta['imagenes']            = $imagenes;
        $oferta['vinculaciones_count'] = $vincCount;
        $oferta['oferente_inactivo']   = (int) $oferta['oferente_inactivo'] === 1;

        return $this->ok($oferta);
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
