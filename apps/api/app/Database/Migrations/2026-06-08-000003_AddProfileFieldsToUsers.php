<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Agrega campos de perfil para validación de identidad: fecha_nacimiento, genero, telefono.
 */
final class AddProfileFieldsToUsers extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('users', [
            'fecha_nacimiento' => ['type' => 'DATE', 'null' => true, 'after' => 'bio'],
            'genero'           => ['type' => 'ENUM', 'constraint' => ['masculino', 'femenino', 'otro', 'prefiero_no_decir'], 'null' => true, 'after' => 'fecha_nacimiento'],
            'telefono'         => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true, 'after' => 'genero'],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('users', ['fecha_nacimiento', 'genero', 'telefono']);
    }
}
