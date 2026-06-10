<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\UserModel;

/**
 * Servicio admin: reactivar un usuario previamente dado de baja.
 *
 * - Reactiva las ofertas que fueron pausadas por admin (pausada_por_admin=1),
 *   restaurando estado='activa' y limpiando el flag.
 * - Limpia los campos de soft delete del usuario (deleted_at, baja_motivo,
 *   baja_por_user_id) y restablece estado_cuenta='activa'.
 * - Registra auditoría append-only.
 * - NO llama a Firebase: el usuario deberá iniciar sesión nuevamente.
 */
final class UsuarioReactivarService
{
    private UserModel $users;
    private AuditoriaModel $auditoria;

    public function __construct()
    {
        $this->users     = model(UserModel::class);
        $this->auditoria = model(AuditoriaModel::class);
    }

    /**
     * Reactiva al usuario indicado.
     *
     * @return array{ofertas_reactivadas:int}
     *
     * @throws \DomainException  Si el usuario no existe o no está dado de baja.
     * @throws \RuntimeException Si la transacción falla.
     */
    public function reactivar(int $userId, int $actorId, string $ip = ''): array
    {
        // Pre-transacción: validaciones
        $user = $this->users->withDeleted()->find($userId);
        if ($user === null) {
            throw new \DomainException('Usuario no encontrado.');
        }
        if ($user['deleted_at'] === null) {
            throw new \DomainException('Usuario no está dado de baja.');
        }

        $db  = \Config\Database::connect();
        $now = date('Y-m-d H:i:s');

        $db->transStart();

        // 1) Reactivar ofertas pausadas por admin (no las pausadas manualmente)
        $db->table('ofertas')
            ->where('user_id', $userId)
            ->where('pausada_por_admin', 1)
            ->update([
                'estado'            => 'activa',
                'pausada_por_admin' => 0,
                'updated_at'        => $now,
            ]);
        $ofertasReactivadas = (int) $db->affectedRows();

        // 2) Limpiar soft delete del usuario
        $db->table('users')
            ->where('id', $userId)
            ->update([
                'estado_cuenta'    => 'activa',
                'deleted_at'       => null,
                'baja_motivo'      => null,
                'baja_por_user_id' => null,
                'updated_at'       => $now,
            ]);

        // 3) Auditoría append-only
        $this->auditoria->registrar(
            $actorId,
            'admin_reactivar_usuario',
            'user',
            $userId,
            ['ofertas_reactivadas' => $ofertasReactivadas],
            $ip !== '' ? $ip : null,
        );

        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new \RuntimeException('Error al reactivar: transacción falló.');
        }

        return ['ofertas_reactivadas' => $ofertasReactivadas];
    }
}
