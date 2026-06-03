<?php

declare(strict_types=1);

namespace Config;

use CodeIgniter\Config\BaseConfig;

/** Cabeceras de seguridad en toda respuesta (doc 04 A05). API JSON-only. */
class SecureHeaders extends BaseConfig
{
    /** @var array<string, string> */
    public array $headers = [
        'X-Content-Type-Options'    => 'nosniff',
        'X-Frame-Options'           => 'DENY',
        'Referrer-Policy'           => 'strict-origin-when-cross-origin',
        'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains; preload',
        'Permissions-Policy'        => 'geolocation=(), microphone=(), camera=()',
        'Content-Security-Policy'   => "default-src 'none'; frame-ancestors 'none'",
        'Cache-Control'             => 'no-store',
    ];
}
