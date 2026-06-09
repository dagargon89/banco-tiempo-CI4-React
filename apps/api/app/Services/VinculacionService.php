<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ConflictException;
use App\Models\AuditoriaModel;
use App\Models\ConversacionModel;
use App\Models\OfertaModel;
use App\Models\UserModel;
use App\Models\VinculacionModel;
use App\Services\Policies\VinculacionPolicyService;

final class VinculacionService
{
    private VinculacionModel $vinculaciones;
    private ConversacionModel $conversaciones;
    private OfertaModel $ofertas;
    private UserModel $users;
    private AuditoriaModel $auditoria;
    private VinculacionPolicyService $policy;

    /** Transiciones de estado válidas. */
    private const TRANSICIONES = [
        'solicitada' => ['aceptada', 'rechazada', 'cancelada'],
        'aceptada'   => ['completada', 'cancelada'],
        'rechazada'  => [],
        'completada' => [],
        'cancelada'  => [],
    ];

    public function __construct()
    {
        $this->vinculaciones  = model(VinculacionModel::class);
        $this->conversaciones = model(ConversacionModel::class);
        $this->ofertas        = model(OfertaModel::class);
        $this->users          = model(UserModel::class);
        $this->auditoria      = model(AuditoriaModel::class);
        $this->policy         = new VinculacionPolicyService();
    }

    /** Un buscador marca interés en una oferta. */
    public function marcarInteres(int $ofertaId, int $buscadorId, string $ip): array
    {
        $user = $this->users->find($buscadorId);
        if ($user === null || $user['estado_verificacion'] !== 'verificado') {
            throw new \DomainException('Debes estar verificado para marcar interés.');
        }

        $oferta = $this->ofertas->find($ofertaId);
        if ($oferta === null || $oferta['estado'] !== 'activa') {
            throw new \RuntimeException('Oferta no encontrada o no está activa.');
        }

        if ((int) $oferta['user_id'] === $buscadorId) {
            throw new \DomainException('No puedes marcar interés en tu propia oferta.');
        }

        if ($this->vinculaciones->existeActiva($ofertaId, $buscadorId)) {
            throw new ConflictException('Ya tienes una vinculación activa con esta oferta.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        $this->vinculaciones->protect(false);
        $this->vinculaciones->insert([
            'oferta_id'   => $ofertaId,
            'buscador_id' => $buscadorId,
            'estado'      => 'solicitada',
        ]);
        $id = (int) $this->vinculaciones->getInsertID();
        $this->vinculaciones->protect(true);

        $this->auditoria->registrar($buscadorId, 'marcar_interes', 'vinculaciones', $id, [
            'oferta_id' => $ofertaId,
        ], $ip);

        $db->transComplete();

        return $this->vinculaciones->conDetalles($id);
    }

    /** Lista vinculaciones del usuario con filtros y paginación. */
    public function listar(int $userId, array $roles, ?string $estado, ?string $rol, int $page, int $perPage): array
    {
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        return $this->vinculaciones->porUsuario($userId, $estado, $rol, $page, $perPage);
    }

    /** Obtiene detalle de una vinculación. */
    public function obtener(int $id, int $userId, array $roles): array
    {
        $vinculacion = $this->vinculaciones->conDetalles($id);
        if ($vinculacion === null) {
            throw new \RuntimeException('Vinculación no encontrada.');
        }

        if (! $this->policy->puedeVer($userId, $vinculacion, $roles)) {
            throw new \DomainException('No tienes permiso para ver esta vinculación.');
        }

        return $vinculacion;
    }

    /** El oferente acepta una solicitud. */
    public function aceptar(int $id, int $userId, string $ip): array
    {
        $db = \Config\Database::connect();
        $db->transStart();

        $vinculacion = $this->obtenerParaTransicion($id);
        $this->validarTransicion($vinculacion['estado'], 'aceptada');

        if (! $this->policy->puedeAceptarRechazar($userId, $vinculacion)) {
            throw new \DomainException('No tienes permiso para aceptar esta vinculación.');
        }

        $this->vinculaciones->protect(false);
        $this->vinculaciones->update($id, [
            'estado'      => 'aceptada',
            'aceptada_at' => date('Y-m-d H:i:s'),
        ]);
        $this->vinculaciones->protect(true);

        // Crear conversación
        $firestoreDocId = 'chat_vinc_' . $id . '_' . bin2hex(random_bytes(8));
        $this->conversaciones->insert([
            'vinculacion_id'  => $id,
            'firestore_doc_id' => $firestoreDocId,
            'estado'          => 'habilitada',
        ]);

        $this->auditoria->registrar($userId, 'aceptar_vinculacion', 'vinculaciones', $id, [], $ip);

        $db->transComplete();

        return $this->vinculaciones->conDetalles($id);
    }

    /** El oferente rechaza una solicitud. */
    public function rechazar(int $id, int $userId, string $ip): array
    {
        $db = \Config\Database::connect();
        $db->transStart();

        $vinculacion = $this->obtenerParaTransicion($id);
        $this->validarTransicion($vinculacion['estado'], 'rechazada');

        if (! $this->policy->puedeAceptarRechazar($userId, $vinculacion)) {
            throw new \DomainException('No tienes permiso para rechazar esta vinculación.');
        }

        $this->vinculaciones->protect(false);
        $this->vinculaciones->update($id, ['estado' => 'rechazada']);
        $this->vinculaciones->protect(true);

        $this->auditoria->registrar($userId, 'rechazar_vinculacion', 'vinculaciones', $id, [], $ip);

        $db->transComplete();

        return $this->vinculaciones->conDetalles($id);
    }

    /** Cualquiera de las partes cancela. */
    public function cancelar(int $id, int $userId, string $ip): array
    {
        $db = \Config\Database::connect();
        $db->transStart();

        $vinculacion = $this->obtenerParaTransicion($id);
        $this->validarTransicion($vinculacion['estado'], 'cancelada');

        if (! $this->policy->puedeCancelar($userId, $vinculacion)) {
            throw new \DomainException('No tienes permiso para cancelar esta vinculación.');
        }

        $this->vinculaciones->protect(false);
        $this->vinculaciones->update($id, [
            'estado'       => 'cancelada',
            'cancelada_por' => $userId,
        ]);
        $this->vinculaciones->protect(true);

        $this->auditoria->registrar($userId, 'cancelar_vinculacion', 'vinculaciones', $id, [
            'estado_previo' => $vinculacion['estado'],
        ], $ip);

        $db->transComplete();

        return $this->vinculaciones->conDetalles($id);
    }

    /** Cada parte confirma la prestación. Si ambos confirman → completada. */
    public function confirmar(int $id, int $userId, string $ip): array
    {
        $db = \Config\Database::connect();
        $db->transStart();

        // SELECT FOR UPDATE para evitar race conditions
        $row = $db->query('SELECT * FROM vinculaciones WHERE id = ? FOR UPDATE', [$id])->getRowArray();
        if ($row === null) {
            $db->transRollback();
            throw new \RuntimeException('Vinculación no encontrada.');
        }

        // Enriquecer con oferente_id para policy check
        $oferta = $this->ofertas->find((int) $row['oferta_id']);
        $row['oferente_id'] = $oferta ? (int) $oferta['user_id'] : 0;

        if (! $this->policy->puedeConfirmar($userId, $row)) {
            $db->transRollback();
            throw new \DomainException('No tienes permiso para confirmar esta vinculación.');
        }

        $updateData = [];
        $esOferente = $userId === (int) $row['oferente_id'];

        if ($esOferente) {
            if ($row['confirmado_oferente']) {
                $db->transRollback();
                throw new ConflictException('Ya has confirmado esta vinculación.');
            }
            $updateData['confirmado_oferente'] = 1;
        } else {
            if ($row['confirmado_buscador']) {
                $db->transRollback();
                throw new ConflictException('Ya has confirmado esta vinculación.');
            }
            $updateData['confirmado_buscador'] = 1;
        }

        // Verificar si ambos han confirmado
        $oferenteOk = $esOferente ? true : (bool) $row['confirmado_oferente'];
        $buscadorOk = ! $esOferente ? true : (bool) $row['confirmado_buscador'];

        if ($oferenteOk && $buscadorOk) {
            $updateData['estado']        = 'completada';
            $updateData['completada_at'] = date('Y-m-d H:i:s');
        }

        $this->vinculaciones->protect(false);
        $this->vinculaciones->update($id, $updateData);
        $this->vinculaciones->protect(true);

        $this->auditoria->registrar($userId, 'confirmar_vinculacion', 'vinculaciones', $id, [
            'rol' => $esOferente ? 'oferente' : 'buscador',
            'completada' => ($oferenteOk && $buscadorOk),
        ], $ip);

        $db->transComplete();

        return $this->vinculaciones->conDetalles($id);
    }

    // --- Helpers privados ---

    /** Obtiene vinculación con oferente_id para validaciones. */
    private function obtenerParaTransicion(int $id): array
    {
        $vinculacion = $this->vinculaciones->conDetalles($id);
        if ($vinculacion === null) {
            throw new \RuntimeException('Vinculación no encontrada.');
        }
        return $vinculacion;
    }

    /** Valida que la transición de estado sea válida. */
    private function validarTransicion(string $estadoActual, string $nuevoEstado): void
    {
        $permitidos = self::TRANSICIONES[$estadoActual] ?? [];
        if (! in_array($nuevoEstado, $permitidos, true)) {
            throw new ConflictException("Transición no permitida: {$estadoActual} → {$nuevoEstado}.");
        }
    }
}
