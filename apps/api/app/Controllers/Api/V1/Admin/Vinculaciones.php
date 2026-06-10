<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Models\AuditoriaModel;
use App\Models\ConversacionModel;
use App\Models\VinculacionModel;
use App\Services\VinculacionService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Vinculaciones extends Controller
{
    use ApiResponder;

    /** GET /admin/vinculaciones */
    public function index(): ResponseInterface
    {
        $estado  = $this->request->getGet('estado');
        $page    = (int) ($this->request->getGet('page') ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 20);
        $page    = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        $vinculacionModel = model(VinculacionModel::class);

        $builder = $vinculacionModel->db->table('vinculaciones v')
            ->select('v.*, o.titulo AS oferta_titulo, o.user_id AS oferente_id, ub.nombre AS buscador_nombre, ub.foto_perfil AS buscador_foto, (ub.deleted_at IS NOT NULL) AS buscador_inactivo, uo.nombre AS oferente_nombre, uo.foto_perfil AS oferente_foto, (uo.deleted_at IS NOT NULL) AS oferente_inactivo')
            ->join('ofertas o', 'o.id = v.oferta_id')
            ->join('users ub', 'ub.id = v.buscador_id')
            ->join('users uo', 'uo.id = o.user_id');

        if ($estado !== null && $estado !== '') {
            $builder->where('v.estado', $estado);
        }

        $total = $builder->countAllResults(false);

        $items = $builder
            ->orderBy('v.created_at', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        return $this->ok($items, [
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
        ]);
    }

    /** GET /admin/vinculaciones/{id}/chat — Moderador lee chat (genera Custom Token). */
    public function leerChat(int $vinculacionId): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $firebaseUid = $this->request->getHeaderLine('X-Auth-FirebaseUid');
        $ip          = $this->request->getIPAddress();

        $vinculacionModel = model(VinculacionModel::class);
        $vinculacion = $vinculacionModel->conDetalles($vinculacionId);

        if ($vinculacion === null) {
            return $this->notFound('Vinculación no encontrada.');
        }

        // SEC-02: Solo con ticket de reporte activo
        $ticketExiste = \Config\Database::connect()->table('tickets')
            ->where('entidad_tipo', 'mensaje')
            ->where('entidad_id', $vinculacionId)
            ->where('tipo', 'reporte')
            ->whereIn('estado', ['abierto', 'en_proceso'])
            ->countAllResults() > 0;

        if (!$ticketExiste) {
            return $this->forbidden('Se requiere un ticket de reporte activo para acceder al chat.');
        }

        $conversacionModel = model(ConversacionModel::class);
        $conversacion = $conversacionModel->porVinculacion($vinculacionId);

        if ($conversacion === null) {
            return $this->notFound('Conversación no encontrada.');
        }

        $firebaseAuth = service('firebaseAuth');
        $customToken  = $firebaseAuth->crearCustomToken($firebaseUid, $conversacion['firestore_doc_id']);

        // Registrar auditoría de acceso moderador al chat
        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar($moderadorId, 'leer_chat_admin', 'conversaciones', (int) $conversacion['id'], [
            'vinculacion_id' => $vinculacionId,
        ], $ip);

        return $this->ok([
            'firebase_custom_token' => $customToken,
            'conversation_id'       => $conversacion['firestore_doc_id'],
            'expires_in'            => 3600,
        ]);
    }
}
