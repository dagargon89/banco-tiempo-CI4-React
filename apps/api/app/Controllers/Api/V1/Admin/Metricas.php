<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Services\MetricasService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Metricas extends Controller
{
    use ApiResponder;

    /** GET /admin/metricas */
    public function index(): ResponseInterface
    {
        return $this->ok((new MetricasService())->obtener());
    }
}
