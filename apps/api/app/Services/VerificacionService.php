<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditoriaModel;
use App\Models\DocumentoVerificacionModel;
use App\Models\UserModel;
use App\Services\Policies\DocumentoPolicyService;

final class VerificacionService
{
    private const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    private const MAX_SIZE      = 10 * 1024 * 1024; // 10 MB

    private UserModel $users;
    private DocumentoVerificacionModel $documentos;
    private AuditoriaModel $auditoria;
    private DocumentoPolicyService $policy;

    public function __construct()
    {
        $this->users      = model(UserModel::class);
        $this->documentos = model(DocumentoVerificacionModel::class);
        $this->auditoria  = model(AuditoriaModel::class);
        $this->policy     = new DocumentoPolicyService();
    }

    /**
     * Flujo unificado: valida metadata, sube el archivo cifrado a Firebase Storage
     * vía Admin SDK (ignora security rules) y registra el documento en BD.
     */
    public function subirYRegistrar(
        int $userId,
        string $firebaseUid,
        string $contentType,
        int $size,
        string $tipoDocumento,
        string $tmpFilePath,
    ): array {
        $user = $this->users->find($userId);
        if ($user === null) {
            throw new \RuntimeException('Usuario no encontrado.');
        }

        // Validar estado
        if (! $this->policy->puedeIniciarVerificacion($user['estado_verificacion'])) {
            throw new \DomainException('No puedes iniciar verificación en estado: ' . $user['estado_verificacion']);
        }

        // Validar content type original (antes del cifrado)
        if ($contentType !== '' && ! in_array($contentType, self::ALLOWED_TYPES, true)) {
            throw new \InvalidArgumentException('Tipo de archivo no permitido. Acepta: jpeg, png, pdf.');
        }

        // Validar tamaño original
        if ($size > 0 && $size > self::MAX_SIZE) {
            throw new \InvalidArgumentException('El archivo debe ser menor a 10MB.');
        }

        // Validar tipo de documento
        $tiposValidos = ['ine', 'pasaporte', 'licencia', 'otro'];
        if (! in_array($tipoDocumento, $tiposValidos, true)) {
            throw new \InvalidArgumentException('Tipo de documento inválido.');
        }

        // Generar ruta con firebase_uid
        $randomHex = bin2hex(random_bytes(16));
        $ruta = "privado/identidad/{$firebaseUid}/{$randomHex}.enc";

        // Subir a Firebase Storage vía Admin SDK (ignora security rules)
        $fileContent = file_get_contents($tmpFilePath);
        if ($fileContent === false) {
            throw new \RuntimeException('No se pudo leer el archivo temporal.');
        }

        /** @var FirebaseStorageService $storage */
        $storage = service('firebaseStorage');
        $storage->upload($ruta, $fileContent, 'application/octet-stream');

        // Registrar en BD (transacción)
        $db = \Config\Database::connect();
        $db->transStart();

        $this->documentos->insert([
            'user_id'        => $userId,
            'ruta_cifrada'   => $ruta,
            'tipo_documento' => $tipoDocumento,
        ]);
        $docId = (int) $this->documentos->getInsertID();

        $this->users->actualizarEstadoVerificacion($userId, 'pendiente');

        $db->transComplete();

        if (! $db->transStatus()) {
            throw new \RuntimeException('Error al registrar el documento.');
        }

        return $this->documentos->find($docId);
    }

    /** Consulta el estado de verificación de un usuario. */
    public function consultarEstado(int $userId): array
    {
        $user = $this->users->find($userId);
        if ($user === null) {
            throw new \RuntimeException('Usuario no encontrado.');
        }

        return [
            'estado'          => $user['estado_verificacion'],
            'motivo_rechazo'  => null,
        ];
    }

    /** Lista los documentos pendientes de revisión. */
    public function listarPendientes(): array
    {
        return $this->documentos->pendientesConUsuario();
    }

    /**
     * Genera URL firmada para que un moderador vea un documento.
     *
     * @return array{url: string, expires_in: int}
     */
    public function obtenerUrlDocumento(int $docId, int $moderadorId, array $roles, string $ip): array
    {
        if (! $this->policy->puedeDescargar($roles)) {
            throw new \DomainException('No tienes permiso para ver documentos.');
        }

        $doc = $this->documentos->porIdConUsuario($docId);
        if ($doc === null) {
            throw new \RuntimeException('Documento no encontrado.');
        }

        /** @var FirebaseStorageService $storage */
        $storage = service('firebaseStorage');
        $url = $storage->getSignedUrl($doc['ruta_cifrada'], 300);

        $this->auditoria->registrar(
            $moderadorId,
            'ver_documento_verificacion',
            'documentos_verificacion',
            $docId,
            ['user_id' => $doc['user_id']],
            $ip,
        );

        return [
            'url'        => $url,
            'expires_in' => 300,
        ];
    }

    /** Aprueba o rechaza la verificación de un usuario. */
    public function resolver(int $userId, int $moderadorId, string $accion, ?string $motivo, string $ip): array
    {
        if (! in_array($accion, ['aprobar', 'rechazar'], true)) {
            throw new \InvalidArgumentException('Acción inválida. Usa: aprobar o rechazar.');
        }

        if ($accion === 'rechazar' && (! $motivo || trim($motivo) === '')) {
            throw new \InvalidArgumentException('Debes proporcionar un motivo para el rechazo.');
        }

        $user = $this->users->find($userId);
        if ($user === null) {
            throw new \RuntimeException('Usuario no encontrado.');
        }

        if ($user['estado_verificacion'] !== 'pendiente') {
            throw new \DomainException('El usuario no está en estado pendiente.');
        }

        $nuevoEstado = $accion === 'aprobar' ? 'verificado' : 'rechazado';

        $db = \Config\Database::connect();
        $db->transStart();

        $this->users->actualizarEstadoVerificacion($userId, $nuevoEstado);

        $docs = $this->documentos->where('user_id', $userId)->where('estado', 'pendiente')->findAll();
        foreach ($docs as $doc) {
            $this->documentos->protect(false)->update($doc['id'], [
                'estado'         => $accion === 'aprobar' ? 'aprobado' : 'rechazado',
                'revisado_por'   => $moderadorId,
                'motivo_rechazo' => $accion === 'rechazar' ? $motivo : null,
            ]);
            $this->documentos->protect(true);
        }

        $this->auditoria->registrar(
            $moderadorId,
            "verificacion_{$accion}",
            'users',
            $userId,
            array_filter(['motivo' => $motivo]),
            $ip,
        );

        $db->transComplete();

        if (! $db->transStatus()) {
            throw new \RuntimeException('Error al resolver la verificación.');
        }

        return $this->users->find($userId);
    }
}
