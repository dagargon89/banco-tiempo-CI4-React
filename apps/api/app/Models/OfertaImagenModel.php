<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class OfertaImagenModel extends Model
{
    protected $table      = 'oferta_imagenes';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $useTimestamps = false;

    protected $allowedFields = ['oferta_id', 'ruta', 'orden'];

    /** @return list<array> Imágenes de una oferta ordenadas por posición. */
    public function porOferta(int $ofertaId): array
    {
        return $this->where('oferta_id', $ofertaId)->orderBy('orden', 'ASC')->findAll();
    }
}
