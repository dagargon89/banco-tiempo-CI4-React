<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * CORS con allowlist estricta del origen del SPA (doc 04).
 * Bearer ID token (no cookies) ⇒ no se requiere credentials.
 */
final class CorsFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $allowed = (string) env('CORS_ALLOWED_ORIGIN', 'http://localhost:5173');
        $origin  = $request->getHeaderLine('Origin');
        $response = service('response');
        $response->setHeader('Vary', 'Origin');

        if ($origin !== '' && hash_equals($allowed, $origin)) {
            $response->setHeader('Access-Control-Allow-Origin', $allowed);
        }
        $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->setHeader('Access-Control-Max-Age', '7200');

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            return $response->setStatusCode(204);
        }
        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
