<?php

declare(strict_types=1);

/**
 * Bootstrap de PHPUnit: arranca CodeIgniter en modo testing y deja la base
 * de pruebas migrada antes de correr la suite.
 *
 * Las pruebas escriben y borran datos reales, así que se niegan a correr
 * contra una base cuyo nombre no termine en "_test". Eso protege la base
 * de desarrollo aunque alguien cambie phpunit.xml o el .env.
 */

require __DIR__ . '/../vendor/codeigniter4/framework/system/Test/bootstrap.php';

$database = (string) (new \Config\Database())->tests['database'];

if (! str_ends_with($database, '_test')) {
    fwrite(STDERR, "PHPUnit se niega a usar la base \"{$database}\": su nombre debe terminar en \"_test\".\n");

    exit(1);
}

if (service('migrations')->setNamespace(null)->latest('tests') === false) {
    fwrite(STDERR, "No se pudieron aplicar las migraciones en \"{$database}\".\n");

    exit(1);
}
