<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class EnlargeProfilePhotoColumn extends Migration
{
    public function up(): void
    {
        $this->forge->modifyColumn('users', [
            'foto_perfil' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->modifyColumn('users', [
            'foto_perfil' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
        ]);
    }
}
