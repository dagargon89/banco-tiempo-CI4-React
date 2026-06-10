<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class ResenaModel extends Model
{
    protected $table         = 'resenas';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = [
        'vinculacion_id',
        'autor_id',
        'destino_id',
        'calificacion',
        'comentario',
    ];

    protected $validationRules = [
        'calificacion' => 'required|integer|greater_than_equal_to[1]|less_than_equal_to[5]',
        'comentario'   => 'permit_empty|max_length[2000]',
    ];

    /** Verifica si ya existe una reseña del autor para esta vinculación. */
    public function existeResena(int $vinculacionId, int $autorId): bool
    {
        return $this->where('vinculacion_id', $vinculacionId)
            ->where('autor_id', $autorId)
            ->countAllResults() > 0;
    }

    /**
     * Reseñas públicas (no ocultas) de un usuario destino, con datos del autor y oferta.
     *
     * @return array{items: list<array>, total: int, estadisticas: array{promedio: float, total: int}}
     */
    public function porDestinoPublicas(int $destinoId, int $page = 1, int $perPage = 10): array
    {
        $builder = $this->db->table('resenas r')
            ->select('r.id, r.vinculacion_id, r.autor_id, r.calificacion, r.comentario, r.created_at, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto, (u.deleted_at IS NOT NULL) AS autor_inactivo, o.titulo AS oferta_titulo')
            ->join('users u', 'u.id = r.autor_id')
            ->join('vinculaciones v', 'v.id = r.vinculacion_id')
            ->join('ofertas o', 'o.id = v.oferta_id')
            ->where('r.destino_id', $destinoId)
            ->where('r.oculta', 0);

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('r.created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        $stats = $this->estadisticas($destinoId);

        return ['items' => $items, 'total' => $total, 'estadisticas' => $stats];
    }

    /**
     * Promedio y total de calificaciones (no ocultas).
     *
     * @return array{promedio: float, total: int}
     */
    public function estadisticas(int $destinoId): array
    {
        $row = $this->db->table('resenas')
            ->select('AVG(calificacion) AS promedio, COUNT(*) AS total')
            ->where('destino_id', $destinoId)
            ->where('oculta', 0)
            ->get()
            ->getRowArray();

        return [
            'promedio' => round((float) ($row['promedio'] ?? 0), 2),
            'total'    => (int) ($row['total'] ?? 0),
        ];
    }

    /** Marca una reseña como reportada (bypass protected fields). */
    public function marcarReportada(int $id): void
    {
        $this->protect(false);
        $this->update($id, ['reportada' => 1]);
        $this->protect(true);
    }

    /** Oculta una reseña (bypass protected fields). */
    public function ocultar(int $id): void
    {
        $this->protect(false);
        $this->update($id, ['oculta' => 1]);
        $this->protect(true);
    }
}
