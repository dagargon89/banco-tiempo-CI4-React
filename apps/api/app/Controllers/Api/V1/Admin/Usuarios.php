<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Models\AuditoriaModel;
use App\Models\UserModel;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Usuarios extends Controller
{
    use ApiResponder;

    /** GET /admin/usuarios */
    public function index(): ResponseInterface
    {
        $estadoVerificacion = $this->request->getGet('estado_verificacion');
        $estadoCuenta       = $this->request->getGet('estado_cuenta');
        $q                  = $this->request->getGet('q');
        $page               = (int) ($this->request->getGet('page') ?? 1);
        $perPage            = (int) ($this->request->getGet('per_page') ?? 20);
        $page               = max(1, $page);
        $perPage            = min(50, max(1, $perPage));

        $userModel = model(UserModel::class);
        $builder = $userModel->db->table('users')
            ->select('id, nombre, email, foto_perfil, estado_verificacion, estado_cuenta, zona, created_at')
            ->where('deleted_at IS NULL');

        if ($estadoVerificacion !== null && $estadoVerificacion !== '') {
            $builder->where('estado_verificacion', $estadoVerificacion);
        }
        if ($estadoCuenta !== null && $estadoCuenta !== '') {
            $builder->where('estado_cuenta', $estadoCuenta);
        }
        if ($q !== null && $q !== '') {
            $builder->groupStart()
                ->like('nombre', $q)
                ->orLike('email', $q)
                ->groupEnd();
        }

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        return $this->ok($items, [
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
        ]);
    }

    /** PATCH /admin/usuarios/{id}/estado */
    public function cambiarEstado(int $id): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip          = $this->request->getIPAddress();
        $body        = $this->request->getJSON(true) ?? [];

        $nuevoEstado = $body['estado_cuenta'] ?? '';
        if (!in_array($nuevoEstado, ['activa', 'suspendida', 'baja'], true)) {
            return $this->unprocessable(['estado_cuenta' => 'Estado inválido. Debe ser: activa, suspendida o baja.']);
        }

        // Prevenir auto-suspensión
        if ($moderadorId === $id && in_array($nuevoEstado, ['suspendida', 'baja'], true)) {
            return $this->forbidden('No puedes suspender o dar de baja tu propia cuenta.');
        }

        $userModel = model(UserModel::class);
        $user = $userModel->find($id);
        if ($user === null) {
            return $this->notFound('Usuario no encontrado.');
        }

        $estadoAnterior = $user['estado_cuenta'];

        $userModel->protect(false)->update($id, ['estado_cuenta' => $nuevoEstado]);
        $userModel->protect(true);

        // Revocar sesiones Firebase si se suspende o da de baja
        if (in_array($nuevoEstado, ['suspendida', 'baja'], true) && !empty($user['firebase_uid'])) {
            try {
                $firebaseAuth = service('firebaseAuth');
                $firebaseAuth->revocarSesiones($user['firebase_uid']);
            } catch (\Throwable) {
                // No bloquear la actualización de BD si Firebase falla
            }
        }

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar($moderadorId, 'admin_cambiar_estado_usuario', 'users', $id, [
            'de' => $estadoAnterior,
            'a'  => $nuevoEstado,
        ], $ip);

        return $this->ok(['message' => 'Estado de cuenta actualizado.', 'estado_cuenta' => $nuevoEstado]);
    }
}
