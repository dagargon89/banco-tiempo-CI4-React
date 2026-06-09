<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\TicketModel;
use App\Services\Policies\TicketPolicyService;

final class TicketService
{
    private TicketModel $tickets;
    private AuditoriaModel $auditoria;
    private TicketPolicyService $policy;

    /** Transiciones de estado válidas. */
    private const TRANSICIONES = [
        'abierto'    => ['en_proceso', 'cerrado'],
        'en_proceso' => ['resuelto', 'cerrado'],
        'resuelto'   => [],
        'cerrado'    => [],
    ];

    public function __construct()
    {
        $this->tickets   = model(TicketModel::class);
        $this->auditoria = model(AuditoriaModel::class);
        $this->policy    = new TicketPolicyService();
    }

    /** Crea un ticket con folio auto-generado. */
    public function crear(int $creadorId, array $datos, string $ip): array
    {
        $tipo = $datos['tipo'] ?? '';
        if (!in_array($tipo, ['reporte', 'sugerencia'], true)) {
            throw new \InvalidArgumentException('El tipo de ticket es inválido.');
        }

        $descripcion = trim($datos['descripcion'] ?? '');
        if (strlen($descripcion) < 10) {
            throw new \InvalidArgumentException('La descripción debe tener al menos 10 caracteres.');
        }

        $entidadTipo = $datos['entidad_tipo'] ?? 'otro';
        if (!in_array($entidadTipo, ['usuario', 'oferta', 'mensaje', 'resena', 'otro'], true)) {
            $entidadTipo = 'otro';
        }

        $this->tickets->db->transStart();

        $folio = $this->tickets->generarFolio();

        $insertData = [
            'folio'        => $folio,
            'creador_id'   => $creadorId,
            'tipo'         => $tipo,
            'entidad_tipo' => $entidadTipo,
            'entidad_id'   => !empty($datos['entidad_id']) ? (int) $datos['entidad_id'] : null,
            'descripcion'  => $descripcion,
        ];

        $this->tickets->insert($insertData);
        $ticketId = (int) $this->tickets->getInsertID();

        $this->auditoria->registrar($creadorId, 'crear_ticket', 'tickets', $ticketId, [
            'folio' => $folio,
            'tipo'  => $tipo,
        ], $ip);

        $this->tickets->db->transComplete();

        return $this->tickets->find($ticketId);
    }

    /** Lista paginada de tickets del usuario. */
    public function misTickets(int $userId, int $page, int $perPage): array
    {
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        return $this->tickets->porCreador($userId, $page, $perPage);
    }

    /** Lista paginada para admin. */
    public function listarAdmin(array $filtros, int $page, int $perPage): array
    {
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        return $this->tickets->listarAdmin($filtros, $page, $perPage);
    }

    /** Auto-asignar ticket a moderador. Si abierto → en_proceso. */
    public function asignar(int $ticketId, int $moderadorId, array $roles, string $ip): array
    {
        if (!$this->policy->puedeAsignar($roles)) {
            throw new \DomainException('No autorizado para asignar tickets.');
        }

        $ticket = $this->tickets->conAsignaciones($ticketId);
        if ($ticket === null) {
            throw new \RuntimeException('Ticket no encontrado.');
        }

        if (!in_array($ticket['estado'], ['abierto', 'en_proceso'], true)) {
            throw new \DomainException('Solo se pueden asignar tickets abiertos o en proceso.');
        }

        $this->tickets->db->transStart();

        // Insertar asignación
        $this->tickets->db->table('ticket_asignaciones')->insert([
            'ticket_id'    => $ticketId,
            'moderador_id' => $moderadorId,
            'asignado_at'  => date('Y-m-d H:i:s'),
        ]);

        // Si abierto → en_proceso
        if ($ticket['estado'] === 'abierto') {
            $this->tickets->db->table('tickets')->where('id', $ticketId)->update([
                'estado'     => 'en_proceso',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        $this->auditoria->registrar($moderadorId, 'asignar_ticket', 'tickets', $ticketId, [
            'estado_anterior' => $ticket['estado'],
        ], $ip);

        $this->tickets->db->transComplete();

        return $this->tickets->conAsignaciones($ticketId);
    }

    /** Cambiar estado de un ticket con validación de transiciones. */
    public function cambiarEstado(int $ticketId, int $moderadorId, array $roles, string $nuevoEstado, ?string $resolucion, string $ip): array
    {
        if (!$this->policy->puedeCambiarEstado($roles)) {
            throw new \DomainException('No autorizado para cambiar estado de tickets.');
        }

        $ticket = $this->tickets->find($ticketId);
        if ($ticket === null) {
            throw new \RuntimeException('Ticket no encontrado.');
        }

        $estadoActual = $ticket['estado'];
        $permitidos = self::TRANSICIONES[$estadoActual] ?? [];

        if (!in_array($nuevoEstado, $permitidos, true)) {
            throw new \DomainException("Transición inválida de '{$estadoActual}' a '{$nuevoEstado}'.");
        }

        if ($nuevoEstado === 'resuelto' && empty(trim($resolucion ?? ''))) {
            throw new \InvalidArgumentException('La resolución es obligatoria para marcar como resuelto.');
        }

        $updateData = [
            'estado'     => $nuevoEstado,
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        if ($nuevoEstado === 'resuelto') {
            $updateData['resolucion'] = trim($resolucion);
        }

        $this->tickets->db->table('tickets')->where('id', $ticketId)->update($updateData);

        $this->auditoria->registrar($moderadorId, 'cambiar_estado_ticket', 'tickets', $ticketId, [
            'de' => $estadoActual,
            'a'  => $nuevoEstado,
        ], $ip);

        return $this->tickets->conAsignaciones($ticketId);
    }
}
