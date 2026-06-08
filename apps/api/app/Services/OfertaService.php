<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\CategoriaModel;
use App\Models\OfertaImagenModel;
use App\Models\OfertaModel;
use App\Models\UserModel;
use App\Services\Policies\OfertaPolicyService;

final class OfertaService
{
    private OfertaModel $ofertas;
    private OfertaImagenModel $imagenes;
    private CategoriaModel $categorias;
    private UserModel $users;
    private AuditoriaModel $auditoria;
    private OfertaPolicyService $policy;

    /** Transiciones de estado válidas. */
    private const TRANSICIONES = [
        'borrador' => ['activa', 'eliminada'],
        'activa'   => ['pausada', 'eliminada'],
        'pausada'  => ['activa', 'eliminada'],
    ];

    public function __construct()
    {
        $this->ofertas    = model(OfertaModel::class);
        $this->imagenes   = model(OfertaImagenModel::class);
        $this->categorias = model(CategoriaModel::class);
        $this->users      = model(UserModel::class);
        $this->auditoria  = model(AuditoriaModel::class);
        $this->policy     = new OfertaPolicyService();
    }

    /** Crea una oferta nueva. Solo usuarios verificados. */
    public function crear(int $userId, array $datos, string $ip): array
    {
        $user = $this->users->find($userId);
        if ($user === null || $user['estado_verificacion'] !== 'verificado') {
            throw new \DomainException('Debes estar verificado para publicar ofertas.');
        }

        $this->validarCategoria($datos['categoria_id'] ?? 0);
        $this->validarPresencialZona($datos);
        $this->encodificarDisponibilidad($datos);

        $datos['user_id'] = $userId;
        $datos['estado']  = 'activa';

        $this->ofertas->protect(false);
        if (! $this->ofertas->insert($datos)) {
            $this->ofertas->protect(true);
            throw new \InvalidArgumentException(implode(' ', $this->ofertas->errors()));
        }
        $id = (int) $this->ofertas->getInsertID();
        $this->ofertas->protect(true);

        $this->auditoria->registrar($userId, 'crear_oferta', 'ofertas', $id, [], $ip);

        return $this->ofertas->conOferente($id);
    }

    /** Actualiza una oferta existente. */
    public function actualizar(int $ofertaId, int $userId, array $roles, array $datos, string $ip): array
    {
        $oferta = $this->ofertas->find($ofertaId);
        if ($oferta === null || $oferta['estado'] === 'eliminada') {
            throw new \RuntimeException('Oferta no encontrada.');
        }

        if (! $this->policy->puedeEditar($userId, $oferta, $roles)) {
            throw new \DomainException('No tienes permiso para editar esta oferta.');
        }

        if (isset($datos['categoria_id'])) {
            $this->validarCategoria($datos['categoria_id']);
        }

        $modalidad = $datos['modalidad'] ?? $oferta['modalidad'];
        $zona      = $datos['zona'] ?? $oferta['zona'];
        if ($modalidad === 'presencial' && (! $zona || trim($zona) === '')) {
            throw new \InvalidArgumentException('La zona es obligatoria para ofertas presenciales.');
        }

        $this->encodificarDisponibilidad($datos);

        if (! $this->ofertas->update($ofertaId, $datos)) {
            throw new \InvalidArgumentException(implode(' ', $this->ofertas->errors()));
        }

        $this->auditoria->registrar($userId, 'actualizar_oferta', 'ofertas', $ofertaId, [], $ip);

        return $this->ofertas->conOferente($ofertaId);
    }

    /** Máquina de estados para ofertas. */
    public function cambiarEstado(int $ofertaId, int $userId, array $roles, string $nuevoEstado, string $ip): array
    {
        $oferta = $this->ofertas->find($ofertaId);
        if ($oferta === null) {
            throw new \RuntimeException('Oferta no encontrada.');
        }

        if (! $this->policy->puedeCambiarEstado($userId, $oferta, $roles)) {
            throw new \DomainException('No tienes permiso para cambiar el estado de esta oferta.');
        }

        $estadoActual    = $oferta['estado'];
        $permitidos      = self::TRANSICIONES[$estadoActual] ?? [];

        if (! in_array($nuevoEstado, $permitidos, true)) {
            throw new \DomainException("Transición no permitida: {$estadoActual} → {$nuevoEstado}.");
        }

        $this->ofertas->protect(false)->update($ofertaId, ['estado' => $nuevoEstado]);
        $this->ofertas->protect(true);

        $this->auditoria->registrar(
            $userId,
            'cambiar_estado_oferta',
            'ofertas',
            $ofertaId,
            ['de' => $estadoActual, 'a' => $nuevoEstado],
            $ip,
        );

        return $this->ofertas->conOferente($ofertaId);
    }

    /** Detalle de una oferta con oferente e imágenes. */
    public function obtener(int $ofertaId): ?array
    {
        $oferta = $this->ofertas->conOferente($ofertaId);
        if ($oferta === null) {
            return null;
        }

        $oferta['imagenes'] = $this->imagenes->porOferta($ofertaId);

        return $oferta;
    }

    /** Exploración pública con filtros y paginación. */
    public function explorar(array $filtros, int $page, int $perPage): array
    {
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        return $this->ofertas->explorar($filtros, $page, $perPage);
    }

    /** Despublicar oferta (acción de moderador). */
    public function despublicar(int $ofertaId, int $moderadorId, string $ip): array
    {
        $oferta = $this->ofertas->find($ofertaId);
        if ($oferta === null) {
            throw new \RuntimeException('Oferta no encontrada.');
        }

        if ($oferta['estado'] !== 'activa') {
            throw new \DomainException('Solo se pueden despublicar ofertas activas.');
        }

        $this->ofertas->protect(false)->update($ofertaId, ['estado' => 'pausada']);
        $this->ofertas->protect(true);

        $this->auditoria->registrar(
            $moderadorId,
            'admin_despublicar_oferta',
            'ofertas',
            $ofertaId,
            [],
            $ip,
        );

        return $this->ofertas->conOferente($ofertaId);
    }

    /** Listado admin con todos los estados. */
    public function listarAdmin(array $filtros, int $page, int $perPage): array
    {
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        return $this->ofertas->listarAdmin($filtros, $page, $perPage);
    }

    // --- Helpers privados ---

    private function validarCategoria(int|string $categoriaId): void
    {
        $cat = $this->categorias->find((int) $categoriaId);
        if ($cat === null || ! $cat['activa']) {
            throw new \InvalidArgumentException('La categoría seleccionada no existe o no está activa.');
        }
    }

    private function validarPresencialZona(array $datos): void
    {
        if (($datos['modalidad'] ?? '') === 'presencial') {
            if (empty($datos['zona']) || trim($datos['zona']) === '') {
                throw new \InvalidArgumentException('La zona es obligatoria para ofertas presenciales.');
            }
        }
    }

    private function encodificarDisponibilidad(array &$datos): void
    {
        if (isset($datos['disponibilidad']) && is_array($datos['disponibilidad'])) {
            $datos['disponibilidad'] = json_encode($datos['disponibilidad']);
        }
    }
}
