<?php

declare(strict_types=1);

namespace Config;

use App\Services\FirebaseAuthService;
use CodeIgniter\Config\BaseService;

/**
 * Contenedor de servicios. `service('firebaseAuth')` permite sustituir
 * el verificador por un doble en pruebas (doc 06).
 */
class Services extends BaseService
{
    public static function firebaseAuth(bool $getShared = true): FirebaseAuthService
    {
        if ($getShared) {
            return static::getSharedInstance('firebaseAuth');
        }
        return new FirebaseAuthService();
    }
}
