<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Models\AuditoriaModel;
use App\Models\CategoriaModel;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Categorias extends Controller
{
    use ApiResponder;

    /** POST /admin/categorias */
    public function create(): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip          = $this->request->getIPAddress();
        $body        = $this->request->getJSON(true) ?? [];

        $nombre = trim($body['nombre'] ?? '');
        if ($nombre === '' || mb_strlen($nombre) > 80) {
            return $this->unprocessable(['nombre' => 'El nombre es obligatorio y máximo 80 caracteres.']);
        }

        $slug = url_title($nombre, '-', true);

        $categoriaModel = model(CategoriaModel::class);

        // Verificar unicidad por nombre
        $existente = $categoriaModel->where('nombre', $nombre)->first();
        if ($existente !== null) {
            return $this->conflict('Ya existe una categoría con ese nombre.');
        }

        $categoriaModel->insert([
            'nombre' => $nombre,
            'slug'   => $slug,
            'activa' => 1,
        ]);
        $categoriaId = (int) $categoriaModel->getInsertID();

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar($moderadorId, 'admin_crear_categoria', 'categorias', $categoriaId, [
            'nombre' => $nombre,
            'slug'   => $slug,
        ], $ip);

        $categoria = $categoriaModel->find($categoriaId);

        return $this->created($categoria);
    }
}
