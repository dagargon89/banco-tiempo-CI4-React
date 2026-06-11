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

    protected $allowedFields = [
        'nombre', 'bio', 'foto_perfil', 'zona', 'fecha_nacimiento', 'genero', 'telefono',
        // Grupo A — matchmaking
        'modalidades_preferidas', 'habilidades_enseno', 'quiere_aprender',
        // Grupo B — disponibilidad
        'franjas_horarias', 'dias_disponibles', 'frecuencia',
        // Grupo C+E — identidad / trayectoria
        'pronombres', 'idiomas', 'causas', 'anios_en_juarez', 'ocupacion_general',
        // Grupo D — privacidad
        'mostrar_edad', 'mostrar_zona', 'mostrar_habilidades', 'permitir_contacto_directo', 'contacto_preferido',
    ];

    protected $validationRules = [
        'nombre'                    => 'required|string|max_length[120]',
        'bio'                       => 'permit_empty|string|max_length[500]',
        'zona'                      => 'permit_empty|string|max_length[120]',
        'fecha_nacimiento'          => 'permit_empty|valid_date[Y-m-d]',
        'genero'                    => 'permit_empty|in_list[masculino,femenino,otro,prefiero_no_decir]',
        'telefono'                  => 'permit_empty|string|max_length[20]',
        'frecuencia'                => 'permit_empty|in_list[puntual,mensual,quincenal,semanal]',
        'pronombres'                => 'permit_empty|string|max_length[60]',
        'anios_en_juarez'           => 'permit_empty|in_list[menos_1,1_5,5_10,mas_10]',
        'ocupacion_general'         => 'permit_empty|string|max_length[120]',
        'mostrar_edad'              => 'permit_empty|in_list[0,1]',
        'mostrar_zona'              => 'permit_empty|in_list[0,1]',
        'mostrar_habilidades'       => 'permit_empty|in_list[0,1]',
        'permitir_contacto_directo' => 'permit_empty|in_list[0,1]',
        'contacto_preferido'        => 'permit_empty|in_list[plataforma,email,whatsapp]',
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
