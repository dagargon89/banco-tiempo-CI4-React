<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Models\AuditoriaModel;
use App\Models\UserModel;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Moderadores extends Controller
{
    use ApiResponder;

    /** GET /admin/moderadores — Lista moderadores activos con nombre. */
    public function index(): ResponseInterface
    {
        $db = \Config\Database::connect();

        $rolModerador = $db->table('roles')->where('nombre', 'moderador')->get()->getRowArray();
        if ($rolModerador === null) {
            return $this->ok([]);
        }

        $moderadores = $db->table('role_user ru')
            ->select('u.id, u.nombre, u.email, u.foto_perfil, ru.created_at AS asignado_at')
            ->join('users u', 'u.id = ru.user_id')
            ->where('ru.role_id', $rolModerador['id'])
            ->where('u.estado_cuenta', 'activa')
            ->orderBy('u.nombre', 'ASC')
            ->get()
            ->getResultArray();

        return $this->ok($moderadores);
    }

    /** POST /admin/moderadores */
    public function create(): ResponseInterface
    {
        $adminId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip      = $this->request->getIPAddress();
        $body    = $this->request->getJSON(true) ?? [];

        $userId = (int) ($body['user_id'] ?? 0);
        if ($userId <= 0) {
            return $this->unprocessable(['user_id' => 'El user_id es obligatorio.']);
        }

        $userModel = model(UserModel::class);
        $user = $userModel->find($userId);

        if ($user === null) {
            return $this->notFound('Usuario no encontrado.');
        }
        if ($user['estado_cuenta'] !== 'activa') {
            return $this->conflict('El usuario debe tener cuenta activa para ser moderador.');
        }

        $db = \Config\Database::connect();

        // Obtener role_id del rol 'moderador'
        $rolModerador = $db->table('roles')->where('nombre', 'moderador')->get()->getRowArray();
        if ($rolModerador === null) {
            return $this->fail('Rol moderador no configurado en el sistema.', 500);
        }

        // Verificar que no tenga ya el rol
        $yaExiste = $db->table('role_user')
            ->where('user_id', $userId)
            ->where('role_id', $rolModerador['id'])
            ->countAllResults() > 0;

        if ($yaExiste) {
            return $this->conflict('El usuario ya tiene rol de moderador.');
        }

        $db->table('role_user')->insert([
            'user_id' => $userId,
            'role_id' => $rolModerador['id'],
        ]);

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar($adminId, 'admin_crear_moderador', 'users', $userId, [
            'role_id' => $rolModerador['id'],
        ], $ip);

        return $this->created(['message' => 'Moderador asignado correctamente.', 'user_id' => $userId]);
    }

    /** DELETE /admin/moderadores/{id} */
    public function delete(int $id): ResponseInterface
    {
        $adminId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip      = $this->request->getIPAddress();

        $db = \Config\Database::connect();

        $rolModerador = $db->table('roles')->where('nombre', 'moderador')->get()->getRowArray();
        if ($rolModerador === null) {
            return $this->fail('Rol moderador no configurado en el sistema.', 500);
        }

        $tieneRol = $db->table('role_user')
            ->where('user_id', $id)
            ->where('role_id', $rolModerador['id'])
            ->countAllResults() > 0;

        if (!$tieneRol) {
            return $this->notFound('El usuario no tiene rol de moderador.');
        }

        $db->table('role_user')
            ->where('user_id', $id)
            ->where('role_id', $rolModerador['id'])
            ->delete();

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar($adminId, 'admin_eliminar_moderador', 'users', $id, [
            'role_id' => $rolModerador['id'],
        ], $ip);

        return $this->ok(['message' => 'Rol de moderador revocado.']);
    }
}
