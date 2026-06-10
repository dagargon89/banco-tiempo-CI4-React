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
        $incluirBajas       = (bool) $this->request->getGet('incluir_bajas');

        $userModel = model(UserModel::class);
        $builder = $userModel->db->table('users')
            ->select('id, nombre, email, foto_perfil, estado_verificacion, estado_cuenta, zona, created_at, deleted_at');

        if (! $incluirBajas) {
            $builder->where('deleted_at IS NULL');
        }

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

    /** GET /admin/usuarios/{id} */
    public function show(int $id): ResponseInterface
    {
        $userModel = model(UserModel::class);
        $user = $userModel->withDeleted()
            ->select('id, nombre, email, foto_perfil, bio, zona, fecha_nacimiento, genero, telefono, estado_verificacion, estado_cuenta, created_at, deleted_at, baja_motivo, baja_por_user_id')
            ->find($id);

        if ($user === null) {
            return $this->notFound('Usuario no encontrado.');
        }

        $db = $userModel->db;

        // vinculaciones donde el usuario participa: como buscador directo
        // o como oferente (vía ofertas.user_id del lado de la oferta vinculada).
        $vinculacionesCompletadas = (int) $db->table('vinculaciones v')
            ->join('ofertas o', 'o.id = v.oferta_id', 'inner')
            ->where('v.estado', 'completada')
            ->groupStart()
                ->where('v.buscador_id', $id)
                ->orWhere('o.user_id', $id)
            ->groupEnd()
            ->countAllResults();

        $counts = [
            'ofertas_activas'            => (int) $db->table('ofertas')->where('user_id', $id)->where('estado', 'activa')->countAllResults(),
            'ofertas_pausadas_por_admin' => (int) $db->table('ofertas')->where('user_id', $id)->where('pausada_por_admin', 1)->countAllResults(),
            'vinculaciones_completadas'  => $vinculacionesCompletadas,
            'resenas_recibidas'          => (int) $db->table('resenas')->where('destino_id', $id)->countAllResults(),
        ];

        $baja = null;
        if ($user['deleted_at'] !== null) {
            $admin = null;
            if ($user['baja_por_user_id'] !== null) {
                $admin = $userModel->withDeleted()->select('id, nombre')->find((int) $user['baja_por_user_id']);
            }
            $baja = [
                'fecha'         => $user['deleted_at'],
                'motivo'        => $user['baja_motivo'],
                'dado_baja_por' => $admin,
            ];
        }

        unset($user['baja_motivo'], $user['baja_por_user_id']);
        $user['baja']   = $baja;
        $user['counts'] = $counts;

        return $this->ok($user);
    }

    /** POST /admin/usuarios/{id}/baja */
    public function darBaja(int $id): ResponseInterface
    {
        $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $body    = $this->request->getJSON(true) ?? [];
        $motivo  = $body['motivo'] ?? null;
        $ip      = $this->request->getIPAddress();

        if ($motivo !== null && strlen((string) $motivo) > 500) {
            return $this->unprocessable(['motivo' => 'Máximo 500 caracteres.']);
        }

        try {
            $result = (new \App\Services\UsuarioBajaService())->darBaja($id, $motivo, $actorId, $ip);
        } catch (\DomainException $e) {
            $msg = $e->getMessage();
            // Mapeo de mensajes a códigos HTTP
            if (str_contains($msg, 'No puedes darte baja')) {
                return $this->forbidden($msg);
            }
            if (str_contains($msg, 'no encontrado')) {
                return $this->notFound($msg);
            }
            if (str_contains($msg, 'ya está dado de baja')) {
                return $this->response->setStatusCode(409)->setJSON(['message' => $msg]);
            }
            return $this->forbidden($msg);
        }

        return $this->ok($result);
    }

    /** POST /admin/usuarios/{id}/reactivar */
    public function reactivar(int $id): ResponseInterface
    {
        $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip      = $this->request->getIPAddress();

        try {
            $result = (new \App\Services\UsuarioReactivarService())->reactivar($id, $actorId, $ip);
        } catch (\DomainException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'no encontrado')) {
                return $this->notFound($msg);
            }
            if (str_contains($msg, 'no está dado de baja')) {
                return $this->response->setStatusCode(409)->setJSON(['message' => $msg]);
            }
            return $this->response->setStatusCode(409)->setJSON(['message' => $msg]);
        }

        return $this->ok($result);
    }
}
