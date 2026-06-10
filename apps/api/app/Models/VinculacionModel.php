<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class VinculacionModel extends Model
{
    protected $table         = 'vinculaciones';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = [
        'oferta_id',
        'buscador_id',
        'estado',
        'confirmado_oferente',
        'confirmado_buscador',
        'cancelada_por',
        'aceptada_at',
        'completada_at',
    ];

    /** Vinculación con datos de buscador, oferente y oferta. */
    public function conDetalles(int $id): ?array
    {
        return $this->db->table('vinculaciones v')
            ->select('v.*, o.titulo AS oferta_titulo, o.user_id AS oferente_id, ub.nombre AS buscador_nombre, ub.foto_perfil AS buscador_foto, (ub.deleted_at IS NOT NULL) AS buscador_inactivo, uo.nombre AS oferente_nombre, uo.foto_perfil AS oferente_foto, (uo.deleted_at IS NOT NULL) AS oferente_inactivo')
            ->join('ofertas o', 'o.id = v.oferta_id')
            ->join('users ub', 'ub.id = v.buscador_id')
            ->join('users uo', 'uo.id = o.user_id')
            ->where('v.id', $id)
            ->get()
            ->getRowArray();
    }

    /**
     * Vinculaciones de un usuario (como buscador u oferente), filtrables por estado y rol.
     *
     * @return array{items: list<array>, total: int}
     */
    public function porUsuario(int $userId, ?string $estado = null, ?string $rol = null, int $page = 1, int $perPage = 12): array
    {
        $builder = $this->db->table('vinculaciones v')
            ->select('v.*, o.titulo AS oferta_titulo, o.user_id AS oferente_id, ub.nombre AS buscador_nombre, ub.foto_perfil AS buscador_foto, (ub.deleted_at IS NOT NULL) AS buscador_inactivo, uo.nombre AS oferente_nombre, uo.foto_perfil AS oferente_foto, (uo.deleted_at IS NOT NULL) AS oferente_inactivo')
            ->join('ofertas o', 'o.id = v.oferta_id')
            ->join('users ub', 'ub.id = v.buscador_id')
            ->join('users uo', 'uo.id = o.user_id');

        if ($rol === 'buscador') {
            $builder->where('v.buscador_id', $userId);
        } elseif ($rol === 'oferente') {
            $builder->where('o.user_id', $userId);
        } else {
            $builder->groupStart()
                ->where('v.buscador_id', $userId)
                ->orWhere('o.user_id', $userId)
                ->groupEnd();
        }

        if ($estado !== null && $estado !== '') {
            $builder->where('v.estado', $estado);
        }

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('v.created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        return ['items' => $items, 'total' => $total];
    }

    /** Verifica si existe una vinculación activa (no terminal) para la oferta y buscador dados. */
    public function existeActiva(int $ofertaId, int $buscadorId): bool
    {
        return $this->where('oferta_id', $ofertaId)
            ->where('buscador_id', $buscadorId)
            ->whereNotIn('estado', ['rechazada', 'completada', 'cancelada'])
            ->countAllResults() > 0;
    }
}
