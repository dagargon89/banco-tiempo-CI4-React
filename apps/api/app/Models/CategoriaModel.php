<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class CategoriaModel extends Model
{
    protected $table      = 'categorias';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $useTimestamps = false;

    protected $allowedFields = ['nombre', 'slug', 'activa'];

    /** @return list<array> Categorías activas ordenadas por nombre. */
    public function activas(): array
    {
        return $this->where('activa', 1)->orderBy('nombre')->findAll();
    }
}
