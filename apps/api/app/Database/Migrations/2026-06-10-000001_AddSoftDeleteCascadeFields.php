<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AddSoftDeleteCascadeFields extends Migration
{
    public function up(): void
    {
        // ofertas.pausada_por_admin — flag para distinguir pausa automática (baja) de manual
        $this->forge->addColumn('ofertas', [
            'pausada_por_admin' => [
                'type'    => 'TINYINT',
                'unsigned'=> true,
                'default' => 0,
                'after'   => 'estado',
            ],
        ]);
        $this->db->query('CREATE INDEX idx_ofertas_pausada_por_admin ON ofertas (pausada_por_admin)');

        // users.baja_motivo y users.baja_por_user_id
        $this->forge->addColumn('users', [
            'baja_motivo' => [
                'type'    => 'VARCHAR',
                'constraint' => 500,
                'null'    => true,
                'after'   => 'deleted_at',
            ],
            'baja_por_user_id' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
                'null'     => true,
                'after'    => 'baja_motivo',
            ],
        ]);
        $this->db->query('ALTER TABLE users ADD CONSTRAINT fk_users_baja_por FOREIGN KEY (baja_por_user_id) REFERENCES users(id) ON DELETE SET NULL');
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE users DROP FOREIGN KEY fk_users_baja_por');
        $this->forge->dropColumn('users', 'baja_por_user_id');
        $this->forge->dropColumn('users', 'baja_motivo');

        $this->db->query('DROP INDEX idx_ofertas_pausada_por_admin ON ofertas');
        $this->forge->dropColumn('ofertas', 'pausada_por_admin');
    }
}
