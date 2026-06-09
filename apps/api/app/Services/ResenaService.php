<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictException;
use App\Models\AuditoriaModel;
use App\Models\ResenaModel;
use App\Models\VinculacionModel;
use App\Services\Policies\ResenaPolicyService;

final class ResenaService
{
    private ResenaModel $resenas;
    private VinculacionModel $vinculaciones;
    private AuditoriaModel $auditoria;
    private ResenaPolicyService $policy;

    public function __construct()
    {
        $this->resenas       = model(ResenaModel::class);
        $this->vinculaciones = model(VinculacionModel::class);
        $this->auditoria     = model(AuditoriaModel::class);
        $this->policy        = new ResenaPolicyService();
    }

    /** Crea una reseña para una vinculación completada. */
    public function crear(int $vinculacionId, int $autorId, array $datos, string $ip): array
    {
        $vinculacion = $this->vinculaciones->conDetalles($vinculacionId);
        if ($vinculacion === null) {
            throw new \RuntimeException('Vinculación no encontrada.');
        }

        if (! $this->policy->puedeCrear($autorId, $vinculacion)) {
            throw new \DomainException('No tienes permiso para reseñar esta vinculación.');
        }

        if ($this->resenas->existeResena($vinculacionId, $autorId)) {
            throw new ConflictException('Ya has dejado una reseña para esta vinculación.');
        }

        // Derivar destino_id server-side: la contraparte del autor
        $destinoId = $autorId === (int) $vinculacion['buscador_id']
            ? (int) $vinculacion['oferente_id']
            : (int) $vinculacion['buscador_id'];

        $db = \Config\Database::connect();
        $db->transStart();

        $this->resenas->insert([
            'vinculacion_id' => $vinculacionId,
            'autor_id'       => $autorId,
            'destino_id'     => $destinoId,
            'calificacion'   => (int) $datos['calificacion'],
            'comentario'     => $datos['comentario'] ?? null,
        ]);
        $id = (int) $this->resenas->getInsertID();

        $this->auditoria->registrar($autorId, 'crear_resena', 'resenas', $id, [
            'vinculacion_id' => $vinculacionId,
            'calificacion'   => (int) $datos['calificacion'],
        ], $ip);

        $db->transComplete();

        return $this->resenas->find($id);
    }

    /** Reseñas públicas de un usuario con estadísticas. */
    public function deUsuario(int $userId, int $page, int $perPage): array
    {
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        return $this->resenas->porDestinoPublicas($userId, $page, $perPage);
    }

    /** Estadísticas de un usuario. */
    public function estadisticas(int $userId): array
    {
        return $this->resenas->estadisticas($userId);
    }

    /** Marca una reseña como reportada. */
    public function reportar(int $resenaId, int $reportadorId, string $ip): void
    {
        $resena = $this->resenas->find($resenaId);
        if ($resena === null) {
            throw new \RuntimeException('Reseña no encontrada.');
        }

        if (! $this->policy->puedeReportar($reportadorId, $resena)) {
            throw new \DomainException('No puedes reportar tu propia reseña.');
        }

        $this->resenas->marcarReportada($resenaId);

        $this->auditoria->registrar($reportadorId, 'reportar_resena', 'resenas', $resenaId, [], $ip);
    }

    /** Un moderador oculta una reseña. */
    public function ocultar(int $resenaId, int $moderadorId, array $roles, string $ip): void
    {
        if (! $this->policy->puedeOcultar($roles)) {
            throw new \DomainException('No tienes permiso para ocultar reseñas.');
        }

        $resena = $this->resenas->find($resenaId);
        if ($resena === null) {
            throw new \RuntimeException('Reseña no encontrada.');
        }

        $this->resenas->ocultar($resenaId);

        $this->auditoria->registrar($moderadorId, 'ocultar_resena', 'resenas', $resenaId, [], $ip);
    }
}
