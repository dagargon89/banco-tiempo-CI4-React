<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Models\CategoriaModel;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Categorias extends Controller
{
    use ApiResponder;

    /** GET /api/v1/categorias — Listado público de categorías activas. */
    public function index(): ResponseInterface
    {
        $categorias = model(CategoriaModel::class)->activas();

        return $this->ok($categorias);
    }
}
