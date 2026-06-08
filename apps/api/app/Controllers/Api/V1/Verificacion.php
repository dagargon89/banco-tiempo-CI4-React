<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Services\VerificacionService;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Endpoints de verificación de identidad para el usuario autenticado.
 */
final class Verificacion extends Controller
{
    use ApiResponder;

    private VerificacionService $service;

    public function __construct()
    {
        $this->service = new VerificacionService();
    }

    /**
     * POST /verificacion/documentos  (multipart/form-data)
     *
     * Flujo unificado: valida, sube a Firebase Storage vía Admin SDK y registra.
     * El frontend cifra el archivo antes de enviarlo; aquí llega el blob cifrado.
     */
    public function registrar(): ResponseInterface
    {
        $userId      = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $firebaseUid = $this->request->getHeaderLine('X-Auth-FirebaseUid');

        $tipoDocumento = $this->request->getPost('tipo_documento') ?? '';
        $contentType   = $this->request->getPost('content_type') ?? '';
        $size          = (int) ($this->request->getPost('size') ?? 0);

        $archivo = $this->request->getFile('archivo');

        if (! $archivo || ! $archivo->isValid()) {
            return $this->unprocessable(['archivo' => 'Archivo requerido.']);
        }
        if ($tipoDocumento === '') {
            return $this->unprocessable(['tipo_documento' => 'Requerido.']);
        }

        try {
            $doc = $this->service->subirYRegistrar(
                $userId,
                $firebaseUid,
                $contentType,
                $size,
                $tipoDocumento,
                $archivo->getTempName(),
            );
            return $this->created($doc);
        } catch (\DomainException $e) {
            return $this->conflict($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->unprocessable(['validation' => $e->getMessage()]);
        }
    }

    /** GET /verificacion/estado */
    public function estado(): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');

        try {
            $result = $this->service->consultarEstado($userId);
            return $this->ok($result);
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }
}
