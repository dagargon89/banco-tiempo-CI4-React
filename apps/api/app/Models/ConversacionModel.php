<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class ConversacionModel extends Model
{
    protected $table         = 'conversaciones';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = [
        'vinculacion_id',
        'firestore_doc_id',
        'estado',
    ];

    /** Busca la conversación asociada a una vinculación. */
    public function porVinculacion(int $vinculacionId): ?array
    {
        return $this->where('vinculacion_id', $vinculacionId)->first();
    }
}
