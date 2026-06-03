<?php

declare(strict_types=1);

namespace Config;

use App\Filters\AuthFirebaseFilter;
use App\Filters\CorsFilter;
use App\Filters\RbacFilter;
use App\Filters\ThrottleFilter;
use CodeIgniter\Config\BaseConfig;
use CodeIgniter\Filters\SecureHeaders;

class Filters extends BaseConfig
{
    /** @var array<string, class-string> */
    public array $aliases = [
        'auth-firebase' => AuthFirebaseFilter::class,
        'rbac'          => RbacFilter::class,
        'throttle'      => ThrottleFilter::class,
        'cors'          => CorsFilter::class,
        'secureheaders' => SecureHeaders::class,
    ];

    /** @var array<string, list<string>> */
    public array $globals = [
        'before' => [],
        'after'  => ['secureheaders'],
    ];

    public array $methods = [];
    public array $filters = [];
}
