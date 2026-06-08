<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Gating de marketplace: solo permite acceso a usuarios verificados.
 * Se aplicará a rutas de ofertas/vinculaciones en futuros sprints.
 */
final class VerificacionFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $estado = $request->getHeaderLine('X-Auth-Verif');

        if ($estado === 'verificado') {
            return $request;
        }

        return service('response')->setStatusCode(403)->setJSON([
            'message'              => 'Debes completar la verificación de identidad para acceder.',
            'estado_verificacion'  => $estado ?: 'no_verificado',
        ]);
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null) {}
}
