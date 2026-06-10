<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\UserModel;

/**
 * Servicio admin: dar de baja un usuario (soft delete) en cascada.
 *
 * - Pausa todas las ofertas activas del usuario marcándolas con
 *   pausada_por_admin=1 (para distinguirlas de pausas manuales).
 * - Marca al usuario como estado_cuenta='baja', deleted_at=NOW().
 * - Registra auditoría append-only.
 * - Revoca sesiones Firebase post-commit (no bloquea la transacción).
 */
final class UsuarioBajaService
{
    private UserModel $users;
    private AuditoriaModel $auditoria;
    private bool $skipFirebase;

    public function __construct(bool $skipFirebase = false)
    {
        $this->users        = model(UserModel::class);
        $this->auditoria    = model(AuditoriaModel::class);
        $this->skipFirebase = $skipFirebase;
    }

    /**
     * Da de baja al usuario indicado.
     *
     * @return array{ofertas_pausadas:int}
     *
     * @throws \DomainException  Si el actor intenta auto-baja, el usuario no
     *                           existe o ya está dado de baja.
     * @throws \RuntimeException Si la transacción falla.
     */
    public function darBaja(int $userId, ?string $motivo, int $actorId): array
    {
        // Pre-transacción: validaciones
        if ($userId === $actorId) {
            throw new \DomainException('No puedes darte baja a ti mismo.');
        }

        $user = $this->users->withDeleted()->find($userId);
        if ($user === null) {
            throw new \DomainException('Usuario no encontrado.');
        }
        if ($user['deleted_at'] !== null) {
            throw new \DomainException('Usuario ya está dado de baja.');
        }

        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        $db->transStart();

        // 1) Pausar ofertas activas y marcarlas como pausadas por admin
        $db->table('ofertas')
            ->where('user_id', $userId)
            ->where('estado', 'activa')
            ->update([
                'estado'            => 'pausada',
                'pausada_por_admin' => 1,
                'updated_at'        => $now,
            ]);
        $ofertasPausadas = (int) $db->affectedRows();

        // 2) Marcar usuario como dado de baja (soft delete + metadatos)
        $db->table('users')
            ->where('id', $userId)
            ->update([
                'estado_cuenta'    => 'baja',
                'deleted_at'       => $now,
                'baja_motivo'      => $motivo,
                'baja_por_user_id' => $actorId,
            ]);

        // 3) Auditoría append-only
        $this->auditoria->registrar(
            $actorId,
            'admin_dar_baja_usuario',
            'user',
            $userId,
            [
                'motivo'           => $motivo,
                'ofertas_pausadas' => $ofertasPausadas,
            ],
        );

        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new \RuntimeException('Error al dar baja: transacción falló.');
        }

        // 4) Post-transacción: revocar sesiones Firebase (no bloquea)
        if (! $this->skipFirebase) {
            $firebaseUid = (string) ($user['firebase_uid'] ?? '');
            if ($firebaseUid !== '') {
                try {
                    service('firebaseAuth')->revocarSesiones($firebaseUid);
                } catch (\Throwable $e) {
                    log_message(
                        'error',
                        'Firebase revoke failed para user_id={user_id}: {msg}',
                        ['user_id' => $userId, 'msg' => $e->getMessage()],
                    );
                    $this->auditoria->registrar(
                        $actorId,
                        'firebase_revoke_failed',
                        'user',
                        $userId,
                        ['error' => $e->getMessage()],
                    );
                }
            }
        }

        return ['ofertas_pausadas' => $ofertasPausadas];
    }
}
