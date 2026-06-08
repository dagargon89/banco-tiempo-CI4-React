<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class AuditoriaModel extends Model
{
    protected $table         = 'auditoria';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = ['actor_id', 'accion', 'entidad_tipo', 'entidad_id', 'metadata', 'ip'];

    /** Append-only: registra una entrada de auditoría. */
    public function registrar(
        int $actorId,
        string $accion,
        string $entidadTipo,
        int $entidadId,
        array $metadata = [],
        ?string $ip = null,
    ): int {
        $this->insert([
            'actor_id'     => $actorId,
            'accion'       => $accion,
            'entidad_tipo' => $entidadTipo,
            'entidad_id'   => $entidadId,
            'metadata'     => $metadata !== [] ? json_encode($metadata) : null,
            'ip'           => $ip,
        ]);

        return (int) $this->getInsertID();
    }
}
