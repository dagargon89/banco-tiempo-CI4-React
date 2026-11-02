<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * La SPA y las reglas del modelo tratan descripcion_completa como opcional,
 * pero la columna era NOT NULL sin default: en modo estricto, crear una
 * oferta sin ella fallaba con un error de base de datos.
 */
class DescripcionCompletaOpcional extends Migration
{
    public function up(): void
    {
        $this->forge->modifyColumn('ofertas', [
            'descripcion_completa' => ['type' => 'TEXT', 'null' => true],
        ]);
    }

    public function down(): void
    {
        $this->db->table('ofertas')->where('descripcion_completa', null)->update(['descripcion_completa' => '']);
        $this->forge->modifyColumn('ofertas', [
            'descripcion_completa' => ['type' => 'TEXT', 'null' => false],
        ]);
    }
}
