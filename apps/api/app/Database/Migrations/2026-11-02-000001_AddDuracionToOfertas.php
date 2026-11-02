<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Duración de una oferta: cuánto dura cada sesión y cuántas sesiones son.
 * Ambas son opcionales; las horas totales se calculan en el cliente.
 */
class AddDuracionToOfertas extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('ofertas', [
            'duracion_sesion_min' => [
                'type'       => 'SMALLINT',
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'capacidad_maxima',
            ],
            'num_sesiones' => [
                'type'       => 'TINYINT',
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'duracion_sesion_min',
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('ofertas', ['duracion_sesion_min', 'num_sesiones']);
    }
}
