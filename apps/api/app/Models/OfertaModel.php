<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class OfertaModel extends Model
{
    protected $table         = 'ofertas';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = [
        'titulo',
        'categoria_id',
        'descripcion_breve',
        'descripcion_completa',
        'modalidad',
        'zona',
        'tipo_capacidad',
        'capacidad_maxima',
        'duracion_sesion_min',
        'num_sesiones',
        'disponibilidad',
    ];

    protected $validationRules = [
        'titulo'             => 'required|string|max_length[140]',
        'categoria_id'       => 'required|integer',
        'descripcion_breve'  => 'required|string|min_length[20]|max_length[200]',
        'modalidad'          => 'required|in_list[presencial,virtual]',
        'tipo_capacidad'     => 'permit_empty|in_list[individual,grupal]',
        'capacidad_maxima'   => 'permit_empty|integer|greater_than[0]',
        'duracion_sesion_min' => 'permit_empty|integer|greater_than_equal_to[15]|less_than_equal_to[480]',
        'num_sesiones'       => 'permit_empty|integer|greater_than[0]|less_than_equal_to[52]',
    ];

    protected $validationMessages = [
        'duracion_sesion_min' => [
            'greater_than_equal_to' => 'Cada sesión debe durar al menos 15 minutos.',
            'less_than_equal_to'    => 'Cada sesión puede durar como máximo 8 horas.',
        ],
        'num_sesiones' => [
            'greater_than'       => 'El número de sesiones debe ser mayor que cero.',
            'less_than_equal_to' => 'Una oferta puede tener como máximo 52 sesiones.',
        ],
    ];

    /** @return list<string> Campos que el dueño de una oferta puede escribir. */
    public function camposEditables(): array
    {
        return $this->allowedFields;
    }

    /** Oferta con datos del oferente (evita N+1). */
    public function conOferente(int $id): ?array
    {
        $row = $this->select('ofertas.*, u.id AS oferente_id, u.nombre AS oferente_nombre, u.foto_perfil AS oferente_foto, (u.deleted_at IS NOT NULL) AS oferente_inactivo')
            ->join('users u', 'u.id = ofertas.user_id')
            ->where('ofertas.id', $id)
            ->first();
        if ($row !== null) {
            $row['oferente_inactivo'] = (int) ($row['oferente_inactivo'] ?? 0);
        }
        return $row;
    }

    /**
     * Exploración pública con filtros opcionales y paginación.
     *
     * @return array{items: list<array>, total: int}
     */
    public function explorar(array $filtros, int $page, int $perPage): array
    {
        $builder = $this->db->table('ofertas o')
            ->select('o.id, o.titulo, o.descripcion_breve, o.modalidad, o.zona, o.categoria_id, o.duracion_sesion_min, o.num_sesiones, o.created_at, u.id AS oferente_id, u.nombre AS oferente_nombre, u.foto_perfil AS oferente_foto, (u.deleted_at IS NOT NULL) AS oferente_inactivo')
            ->join('users u', 'u.id = o.user_id')
            ->where('o.estado', 'activa');

        if (! empty($filtros['categoria_id'])) {
            $builder->where('o.categoria_id', (int) $filtros['categoria_id']);
        }
        if (! empty($filtros['modalidad'])) {
            $builder->where('o.modalidad', $filtros['modalidad']);
        }
        if (! empty($filtros['zona'])) {
            $builder->like('o.zona', $filtros['zona']);
        }
        if (! empty($filtros['q'])) {
            $q = $filtros['q'];
            $builder->groupStart()
                ->like('o.titulo', $q)
                ->orLike('o.descripcion_breve', $q)
                ->groupEnd();
        }

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('o.created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        foreach ($items as &$item) {
            $item['oferente_inactivo'] = (int) ($item['oferente_inactivo'] ?? 0);
        }
        unset($item);

        return ['items' => $items, 'total' => $total];
    }

    /** Ofertas propias excluyendo eliminadas. */
    public function porUsuario(int $userId): array
    {
        return $this->select('ofertas.*, c.nombre AS categoria_nombre')
            ->join('categorias c', 'c.id = ofertas.categoria_id', 'left')
            ->where('ofertas.user_id', $userId)
            ->where('ofertas.estado !=', 'eliminada')
            ->orderBy('ofertas.created_at', 'DESC')
            ->findAll();
    }

    /**
     * Listado admin: todas las ofertas con filtros opcionales.
     *
     * @return array{items: list<array>, total: int}
     */
    public function listarAdmin(array $filtros, int $page, int $perPage): array
    {
        $builder = $this->db->table('ofertas o')
            ->select('o.*, u.nombre AS oferente_nombre, u.foto_perfil AS oferente_foto, (u.deleted_at IS NOT NULL) AS oferente_inactivo, c.nombre AS categoria_nombre')
            ->join('users u', 'u.id = o.user_id')
            ->join('categorias c', 'c.id = o.categoria_id', 'left');

        if (! empty($filtros['estado'])) {
            $builder->where('o.estado', $filtros['estado']);
        }
        if (! empty($filtros['categoria_id'])) {
            $builder->where('o.categoria_id', (int) $filtros['categoria_id']);
        }
        if (! empty($filtros['q'])) {
            $q = $filtros['q'];
            $builder->groupStart()
                ->like('o.titulo', $q)
                ->orLike('o.descripcion_breve', $q)
                ->groupEnd();
        }

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('o.created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        foreach ($items as &$item) {
            $item['oferente_inactivo'] = (int) ($item['oferente_inactivo'] ?? 0);
            $item['pausada_por_admin'] = (int) ($item['pausada_por_admin'] ?? 0);
        }
        unset($item);

        return ['items' => $items, 'total' => $total];
    }
}
