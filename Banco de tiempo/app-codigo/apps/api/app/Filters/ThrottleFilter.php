<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Rate limiting (doc 04 A04, doc 05). Throttler de CI4 (Redis).
 * Uso: 'throttle:auth' | 'throttle:ofertas' | 'throttle:tickets' | 'throttle:api'.
 */
final class ThrottleFilter implements FilterInterface
{
    /** @var array<string, array{0:int,1:int}> [intentos, ventana_seg] */
    private const BUCKETS = [
        'auth'    => [10, MINUTE],
        'api'     => [60, MINUTE],
        'ofertas' => [10, HOUR],
        'tickets' => [10, HOUR],
    ];

    public function before(RequestInterface $request, $arguments = null)
    {
        $bucket = $arguments[0] ?? 'api';
        [$cap, $win] = self::BUCKETS[$bucket] ?? self::BUCKETS['api'];
        $identity = $request->userId ?? $request->getIPAddress();
        $key = 'throttle:' . $bucket . ':' . hash('sha256', (string) $identity);

        $throttler = service('throttler');
        if (! $throttler->check($key, $cap, $win)) {
            return service('response')->setStatusCode(429)
                ->setHeader('Retry-After', (string) $throttler->getTokenTime())
                ->setJSON(['message' => 'Demasiadas peticiones. Intenta más tarde.']);
        }
        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
