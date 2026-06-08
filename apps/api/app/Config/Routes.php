<?php

declare(strict_types=1);

use CodeIgniter\Router\RouteCollection;

/**
 * Rutas de la API REST — Banco de Tiempo (doc 05).
 * Auto-routing DESHABILITADO. Filtros: cors → (auth-firebase) → (rbac).
 *
 * @var RouteCollection $routes
 */
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api\V1', 'filter' => 'cors'], static function (RouteCollection $routes): void {

    // Auth: el SPA inicia sesión en Firebase; aquí solo se sincroniza/aprovisiona.
    $routes->post('auth/sync', 'Auth::sync', ['filter' => ['auth-firebase', 'throttle:auth']]);

    // Catálogo y exploración pública
    $routes->get('categorias', 'Categorias::index');
    $routes->get('ofertas', 'Ofertas::index');
    $routes->get('ofertas/(:num)', 'Ofertas::show/$1');
    $routes->get('usuarios/(:num)/resenas', 'Resenas::deUsuario/$1');

    // Autenticado (Firebase ID token)
    $routes->group('', ['filter' => 'auth-firebase'], static function (RouteCollection $routes): void {
        $routes->get('me', 'Me::show');
        $routes->patch('me', 'Me::update');
        $routes->post('me/foto', 'Me::uploadFoto');
        $routes->get('me/ofertas', 'Me::ofertas');
        $routes->get('usuarios/(:num)', 'Usuarios::show/$1');

        // Verificación de identidad (archivo cifrado sube vía API → Admin SDK)
        $routes->post('verificacion/documentos', 'Verificacion::registrar');
        $routes->get('verificacion/estado', 'Verificacion::estado');

        // Subida de imágenes públicas
        $routes->post('uploads/imagen-token', 'Uploads::imagenToken');

        // Ofertas (mutaciones; verificado lo aplica el PolicyService)
        $routes->post('ofertas', 'Ofertas::create', ['filter' => 'throttle:ofertas']);
        $routes->patch('ofertas/(:num)', 'Ofertas::update/$1');
        $routes->patch('ofertas/(:num)/estado', 'Ofertas::cambiarEstado/$1');

        // Vinculaciones (máquina de estados)
        $routes->post('ofertas/(:num)/interes', 'Vinculaciones::marcarInteres/$1');
        $routes->get('vinculaciones', 'Vinculaciones::index');
        $routes->get('vinculaciones/(:num)', 'Vinculaciones::show/$1');
        $routes->patch('vinculaciones/(:num)/aceptar', 'Vinculaciones::aceptar/$1');
        $routes->patch('vinculaciones/(:num)/rechazar', 'Vinculaciones::rechazar/$1');
        $routes->patch('vinculaciones/(:num)/cancelar', 'Vinculaciones::cancelar/$1');
        $routes->patch('vinculaciones/(:num)/confirmar', 'Vinculaciones::confirmar/$1');

        // Chat (Custom Token de Firebase acotado)
        $routes->post('vinculaciones/(:num)/chat/token', 'Chat::token/$1');

        // Reseñas y tickets
        $routes->post('vinculaciones/(:num)/resena', 'Resenas::create/$1');
        $routes->post('resenas/(:num)/reportar', 'Resenas::reportar/$1');
        $routes->post('tickets', 'Tickets::create', ['filter' => 'throttle:tickets']);
        $routes->get('tickets/mios', 'Tickets::mios');
    });

    // Administración (RBAC)
    $routes->group('admin', ['filter' => ['auth-firebase:strict', 'rbac:moderador']], static function (RouteCollection $routes): void {
        $routes->get('usuarios', 'Admin\Usuarios::index');
        $routes->patch('usuarios/(:num)/estado', 'Admin\Usuarios::cambiarEstado/$1');
        $routes->get('verificaciones', 'Admin\Verificaciones::index');
        $routes->get('verificaciones/(:num)/documento', 'Admin\Verificaciones::documento/$1');
        $routes->patch('verificaciones/(:num)', 'Admin\Verificaciones::resolver/$1');
        $routes->get('ofertas', 'Admin\Ofertas::index');
        $routes->patch('ofertas/(:num)/despublicar', 'Admin\Ofertas::despublicar/$1');
        $routes->patch('resenas/(:num)/ocultar', 'Admin\Resenas::ocultar/$1');
        $routes->get('vinculaciones', 'Admin\Vinculaciones::index');
        $routes->get('vinculaciones/(:num)/chat', 'Admin\Vinculaciones::leerChat/$1');
        $routes->get('tickets', 'Admin\Tickets::index');
        $routes->patch('tickets/(:num)/asignar', 'Admin\Tickets::asignar/$1');
        $routes->patch('tickets/(:num)/estado', 'Admin\Tickets::cambiarEstado/$1');
        $routes->get('metricas', 'Admin\Metricas::index');

        $routes->group('', ['filter' => 'rbac:super_admin'], static function (RouteCollection $routes): void {
            $routes->post('categorias', 'Admin\Categorias::create');
            $routes->post('moderadores', 'Admin\Moderadores::create');
            $routes->delete('moderadores/(:num)', 'Admin\Moderadores::delete/$1');
        });
    });
});
