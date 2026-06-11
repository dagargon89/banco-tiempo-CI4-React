<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Expande el perfil con campos relevantes para Banco de Tiempo sin pedir
 * datos sensibles (dirección exacta, GPS, etc.). Cubre:
 *  - Matchmaking de intercambio (habilidades, modalidades).
 *  - Disponibilidad sin ubicación exacta (franjas, días, frecuencia).
 *  - Identidad inclusiva y trayectoria suave (pronombres, idiomas, causas).
 *  - Toggles de privacidad sobre qué se ve público.
 *
 * Multi-valores se guardan como JSON (MySQL 8). Para los toggles se usa
 * TINYINT(1) (CI4 estándar para booleans).
 */
final class ExpandUserProfile extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('users', [
            // Grupo A — matchmaking
            'modalidades_preferidas' => ['type' => 'JSON', 'null' => true, 'after' => 'telefono'],
            'habilidades_enseno'     => ['type' => 'JSON', 'null' => true, 'after' => 'modalidades_preferidas'],
            'quiere_aprender'        => ['type' => 'JSON', 'null' => true, 'after' => 'habilidades_enseno'],

            // Grupo B — disponibilidad
            'franjas_horarias' => ['type' => 'JSON', 'null' => true, 'after' => 'quiere_aprender'],
            'dias_disponibles' => ['type' => 'JSON', 'null' => true, 'after' => 'franjas_horarias'],
            'frecuencia'       => ['type' => 'ENUM', 'constraint' => ['puntual', 'mensual', 'quincenal', 'semanal'], 'null' => true, 'after' => 'dias_disponibles'],

            // Grupo C+E — identidad / trayectoria
            'pronombres'        => ['type' => 'VARCHAR', 'constraint' => 60, 'null' => true, 'after' => 'frecuencia'],
            'idiomas'           => ['type' => 'JSON', 'null' => true, 'after' => 'pronombres'],
            'causas'            => ['type' => 'JSON', 'null' => true, 'after' => 'idiomas'],
            'anios_en_juarez'   => ['type' => 'ENUM', 'constraint' => ['menos_1', '1_5', '5_10', 'mas_10'], 'null' => true, 'after' => 'causas'],
            'ocupacion_general' => ['type' => 'VARCHAR', 'constraint' => 120, 'null' => true, 'after' => 'anios_en_juarez'],

            // Grupo D — privacidad
            'mostrar_edad'              => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0, 'after' => 'ocupacion_general'],
            'mostrar_zona'              => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1, 'after' => 'mostrar_edad'],
            'mostrar_habilidades'       => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1, 'after' => 'mostrar_zona'],
            'permitir_contacto_directo' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0, 'after' => 'mostrar_habilidades'],
            'contacto_preferido'        => ['type' => 'ENUM', 'constraint' => ['plataforma', 'email', 'whatsapp'], 'default' => 'plataforma', 'after' => 'permitir_contacto_directo'],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('users', [
            'modalidades_preferidas',
            'habilidades_enseno',
            'quiere_aprender',
            'franjas_horarias',
            'dias_disponibles',
            'frecuencia',
            'pronombres',
            'idiomas',
            'causas',
            'anios_en_juarez',
            'ocupacion_general',
            'mostrar_edad',
            'mostrar_zona',
            'mostrar_habilidades',
            'permitir_contacto_directo',
            'contacto_preferido',
        ]);
    }
}
