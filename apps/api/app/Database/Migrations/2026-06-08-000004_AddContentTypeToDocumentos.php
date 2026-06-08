<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Almacena el content_type original del documento para poder visualizarlo correctamente.
 */
final class AddContentTypeToDocumentos extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('documentos_verificacion', [
            'content_type' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true, 'after' => 'tipo_documento'],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('documentos_verificacion', 'content_type');
    }
}
