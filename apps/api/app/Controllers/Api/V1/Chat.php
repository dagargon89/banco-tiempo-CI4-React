<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Models\ConversacionModel;
use App\Models\VinculacionModel;
use App\Services\Policies\VinculacionPolicyService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Chat extends Controller
{
    use ApiResponder;

    /** POST /api/v1/vinculaciones/{id}/chat/token */
    public function token(int $vinculacionId): ResponseInterface
    {
        $userId      = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $firebaseUid = $this->request->getHeaderLine('X-Auth-FirebaseUid');
        $roles       = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));

        $vinculacionModel = model(VinculacionModel::class);
        $vinculacion = $vinculacionModel->conDetalles($vinculacionId);

        if ($vinculacion === null) {
            return $this->notFound('Vinculación no encontrada.');
        }

        $policy = new VinculacionPolicyService();
        if (! $policy->puedeVerChat($userId, $vinculacion, $roles)) {
            return $this->forbidden('No tienes acceso al chat de esta vinculación.');
        }

        $conversacionModel = model(ConversacionModel::class);
        $conversacion = $conversacionModel->porVinculacion($vinculacionId);

        if ($conversacion === null) {
            return $this->notFound('Conversación no encontrada.');
        }

        $firebaseAuth = service('firebaseAuth');
        $customToken  = $firebaseAuth->crearCustomToken($firebaseUid, $conversacion['firestore_doc_id']);

        return $this->ok([
            'firebase_custom_token' => $customToken,
            'conversation_id'       => $conversacion['firestore_doc_id'],
            'expires_in'            => 3600,
        ]);
    }
}
