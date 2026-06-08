<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * Usuarios (doc 03). La autenticación la gestiona Firebase: no hay password_hash.
 * $allowedFields excluye campos sensibles/controlados (anti mass-assignment, doc 04).
 */
final class UserModel extends Model
{
    protected $table            = 'users';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $useTimestamps    = true;

    protected $allowedFields = ['nombre', 'bio', 'foto_perfil', 'zona'];

    protected $validationRules = [
        'nombre' => 'required|string|max_length[120]',
        'bio'    => 'permit_empty|string|max_length[500]',
        'zona'   => 'permit_empty|string|max_length[120]',
    ];

    public function porFirebaseUid(string $uid): ?array
    {
        return $this->where('firebase_uid', $uid)->where('estado_cuenta !=', 'baja')->first();
    }

    public function porEmail(string $email): ?array
    {
        return $this->where('email', $email)->first();
    }

    /** Aprovisionamiento Just-In-Time tras verificar el ID token (ADR-008). */
    public function aprovisionar(string $uid, string $nombre, string $email, bool $emailVerificado): int
    {
        $now = date('Y-m-d H:i:s');
        $this->protect(false)->insert([
            'firebase_uid'        => $uid,
            'nombre'              => $nombre,
            'email'               => $email,
            'estado_verificacion' => 'no_verificado',
            'estado_cuenta'       => 'activa',
            'email_verified_at'   => $emailVerificado ? $now : null,
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);
        $id = (int) $this->getInsertID();
        $this->protect(true);
        return $id;
    }

    /** Actualiza el estado_verificacion de un usuario (campo protegido). */
    public function actualizarEstadoVerificacion(int $userId, string $estado): bool
    {
        $this->protect(false)->update($userId, ['estado_verificacion' => $estado]);
        $this->protect(true);
        return true;
    }

    /** @return list<string> roles administrativos del usuario */
    public function rolesDe(int $userId): array
    {
        $rows = $this->db->table('role_user ru')
            ->select('r.nombre')->join('roles r', 'r.id = ru.role_id')
            ->where('ru.user_id', $userId)->get()->getResultArray();
        return array_column($rows, 'nombre');
    }
}
