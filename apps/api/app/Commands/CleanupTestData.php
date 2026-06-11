<?php

declare(strict_types=1);

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/**
 * Elimina basura generada por los tests de PHPUnit cuando alguno se
 * interrumpe sin que su tearDown complete la limpieza. Detecta usuarios
 * con dominio @test.local o con prefijos de firebase_uid usados por los
 * fixtures, y borra los usuarios — el resto cae en cascada por las FKs.
 *
 * Preserva siempre los emails reales listados en PRESERVED_EMAILS.
 */
final class CleanupTestData extends BaseCommand
{
    /** @var string */
    protected $group = 'Cleanup';

    /** @var string */
    protected $name = 'cleanup:test-data';

    /** @var string */
    protected $description = 'Borra usuarios de test (y datos en cascada) que hayan quedado en la BD por tests interrumpidos.';

    /** @var string */
    protected $usage = 'cleanup:test-data [--dry-run]';

    /** Emails que nunca deben borrarse aunque cumplan algún patrón. */
    private const PRESERVED_EMAILS = [
        'dgarcia@planjuarez.org',
        'test@test.com',
    ];

    /** Prefijos de firebase_uid que los fixtures de los tests usan. */
    private const TEST_UID_PREFIXES = [
        'test-', 'vinc-', 'res-', 'tk-', 'tkt-', 'crud-', 'show-',
        'index-', 'noverif-', 'target-', 'admin-ofertas-', 'otro-',
    ];

    public function run(array $params): void
    {
        $dryRun = CLI::getOption('dry-run') !== null;
        $db     = \Config\Database::connect();

        // ── 1. Detectar usuarios test ─────────────────────────────────
        $builder = $db->table('users')
            ->select('id, nombre, email')
            ->groupStart()
                ->like('email', '@test.local', 'before')
                ->orLike('email', '@example.com', 'before')
                ->orLike('email', '@example.org', 'before');

        foreach (self::TEST_UID_PREFIXES as $prefix) {
            $builder->orLike('firebase_uid', $prefix, 'after');
        }

        $builder->groupEnd()
            ->whereNotIn('email', self::PRESERVED_EMAILS);

        $users = $builder->get()->getResultArray();
        $userIds = array_map(static fn ($u) => (int) $u['id'], $users);

        // ── 2. Detectar categorías test ───────────────────────────────
        $cats = $db->table('categorias')
            ->select('id, nombre')
            ->groupStart()
                ->like('nombre', 'VincCat ', 'after')
                ->orLike('slug', 'vinc-cat-', 'after')
            ->groupEnd()
            ->get()
            ->getResultArray();
        $catIds = array_map(static fn ($c) => (int) $c['id'], $cats);

        // ── 3. Reportar ───────────────────────────────────────────────
        CLI::write('Usuarios test detectados: ' . count($userIds), 'yellow');
        foreach ($users as $u) {
            CLI::write("  - #{$u['id']}  {$u['nombre']}  <{$u['email']}>");
        }
        CLI::write('Categorías test detectadas: ' . count($catIds), 'yellow');
        foreach ($cats as $c) {
            CLI::write("  - #{$c['id']}  {$c['nombre']}");
        }

        if ($dryRun) {
            CLI::write('Modo --dry-run: no se borró nada.', 'cyan');
            return;
        }

        if (empty($userIds) && empty($catIds)) {
            CLI::write('Nada que borrar. BD limpia.', 'green');
            return;
        }

        // ── 4. Borrar (FKs ON DELETE CASCADE hacen el resto) ──────────
        $db->transStart();

        if (!empty($userIds)) {
            // ofertas -> oferta_imagenes, vinculaciones, conversaciones, resenas (todo cascade)
            // role_user, documentos_verificacion, tickets, ticket_asignaciones,
            // notificaciones también caen por FK CASCADE desde users.
            $db->table('users')->whereIn('id', $userIds)->delete();
        }

        if (!empty($catIds)) {
            // Las ofertas de estas categorías ya cayeron con sus usuarios.
            $db->table('categorias')->whereIn('id', $catIds)->delete();
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            CLI::error('Error en la transacción. No se aplicaron cambios.');
            return;
        }

        CLI::write('Usuarios borrados: ' . count($userIds), 'green');
        CLI::write('Categorías borradas: ' . count($catIds), 'green');
        CLI::write('Cascada de FKs limpió ofertas, vinculaciones, conversaciones, reseñas, tickets, etc.', 'green');
    }
}
