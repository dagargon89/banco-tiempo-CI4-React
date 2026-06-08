<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddZonaToUsers extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('users', [
            'zona' => [
                'type'       => 'VARCHAR',
                'constraint' => 120,
                'null'       => true,
                'after'      => 'foto_perfil',
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('users', 'zona');
    }
}
