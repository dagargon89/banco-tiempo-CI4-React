<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class TicketModel extends Model
{
    protected $table         = 'tickets';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = ['folio', 'creador_id', 'tipo', 'entidad_tipo', 'entidad_id', 'descripcion'];

    protected $validationRules = [
        'tipo'        => 'required|in_list[reporte,sugerencia]',
        'descripcion' => 'required|min_length[10]|max_length[5000]',
    ];

    /** Genera folio único TK-YYYY-NNNNNN con bloqueo FOR UPDATE. */
    public function generarFolio(): string
    {
        $year = date('Y');
        $prefix = "TK-{$year}-";

        $row = $this->db->query(
            "SELECT MAX(folio) AS max_folio FROM {$this->table} WHERE folio LIKE ? FOR UPDATE",
            [$prefix . '%']
        )->getRowArray();

        if ($row['max_folio'] === null) {
            return $prefix . '000001';
        }

        $lastNum = (int) substr($row['max_folio'], -6);
        return $prefix . str_pad((string) ($lastNum + 1), 6, '0', STR_PAD_LEFT);
    }

    /** Lista paginada de tickets del usuario. */
    public function porCreador(int $creadorId, int $page, int $perPage): array
    {
        $builder = $this->where('creador_id', $creadorId);

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->findAll();

        return ['items' => $items, 'total' => $total];
    }

    /** Lista paginada para admin con JOIN a users. Filtros: tipo, estado, q. */
    public function listarAdmin(array $filtros, int $page, int $perPage): array
    {
        $builder = $this->db->table("{$this->table} t")
            ->select('t.*, u.nombre AS creador_nombre')
            ->join('users u', 'u.id = t.creador_id');

        if (!empty($filtros['tipo'])) {
            $builder->where('t.tipo', $filtros['tipo']);
        }
        if (!empty($filtros['estado'])) {
            $builder->where('t.estado', $filtros['estado']);
        }
        if (!empty($filtros['q'])) {
            $builder->groupStart()
                ->like('t.folio', $filtros['q'])
                ->orLike('t.descripcion', $filtros['q'])
                ->orLike('u.nombre', $filtros['q'])
                ->groupEnd();
        }

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('t.created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        return ['items' => $items, 'total' => $total];
    }

    /** Ticket con historial de asignaciones. */
    public function conAsignaciones(int $id): ?array
    {
        $ticket = $this->find($id);
        if ($ticket === null) {
            return null;
        }

        $asignaciones = $this->db->table('ticket_asignaciones ta')
            ->select('ta.*, u.nombre AS moderador_nombre')
            ->join('users u', 'u.id = ta.moderador_id')
            ->where('ta.ticket_id', $id)
            ->orderBy('ta.asignado_at', 'DESC')
            ->get()
            ->getResultArray();

        $ticket['asignaciones'] = $asignaciones;

        // Nombre del último asignado
        if (!empty($asignaciones)) {
            $ticket['asignado_a_nombre'] = $asignaciones[0]['moderador_nombre'];
        }

        return $ticket;
    }
}
