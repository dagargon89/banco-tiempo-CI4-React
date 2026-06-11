<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Agrega 4 roles administrativos especializados al sistema.
 * Idempotente: usa INSERT IGNORE para no duplicar si ya existen.
 *
 *  - soporte:           atención a usuarios (tickets).
 *  - verificador:       aprueba/rechaza documentos de identidad.
 *  - analista:          solo lectura de métricas y reportes.
 *  - editor_categorias: gestiona el catálogo de categorías.
 *
 * Los permisos efectivos por endpoint se aplican a través del filtro rbac;
 * esta migración solo registra los roles para que puedan asignarse.
 */
final class AddAdminRoles extends Migration
{
    private const NEW_ROLES = ['soporte', 'verificador', 'analista', 'editor_categorias'];

    public function up(): void
    {
        foreach (self::NEW_ROLES as $rol) {
            $this->db->query('INSERT IGNORE INTO roles (nombre) VALUES (?)', [$rol]);
        }
    }

    public function down(): void
    {
        // Limpiar pivotes antes de borrar el rol.
        foreach (self::NEW_ROLES as $rol) {
            $this->db->query(
                'DELETE ru FROM role_user ru JOIN roles r ON r.id = ru.role_id WHERE r.nombre = ?',
                [$rol],
            );
            $this->db->query('DELETE FROM roles WHERE nombre = ?', [$rol]);
        }
    }
}
