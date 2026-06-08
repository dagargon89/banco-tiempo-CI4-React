<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1;

use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Perfil del usuario autenticado (GET/PATCH /api/v1/me).
 */
final class Me extends Controller
{
    use ApiResponder;

    public function show(): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $users  = model(\App\Models\UserModel::class);
        $u      = $users->find($userId);

        if ($u === null) {
            return $this->notFound('Usuario no encontrado.');
        }

        $roles = array_filter(explode(',', $this->request->getHeaderLine('X-Auth-Roles')));

        return $this->ok([
            'id'                  => (int) $u['id'],
            'nombre'              => $u['nombre'],
            'email'               => $u['email'],
            'bio'                 => $u['bio'] ?? '',
            'foto_perfil'         => $u['foto_perfil'] ?? null,
            'zona'                => $u['zona'] ?? null,
            'email_verificado'    => $u['email_verified_at'] !== null,
            'estado_verificacion' => $u['estado_verificacion'],
            'estado_cuenta'       => $u['estado_cuenta'],
            'roles'               => $roles,
            'created_at'          => $u['created_at'],
        ]);
    }

    public function update(): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $users  = model(\App\Models\UserModel::class);

        $data = $this->request->getJSON(true) ?? [];
        $allowed = array_intersect_key($data, array_flip(['nombre', 'bio', 'foto_perfil', 'zona']));

        if ($allowed === []) {
            return $this->fail('No hay campos válidos para actualizar.');
        }

        if (! $users->update($userId, $allowed)) {
            return $this->unprocessable($users->errors());
        }

        return $this->show();
    }

    /** POST /me/foto — Sube foto de perfil a Firebase Storage vía Admin SDK. */
    public function uploadFoto(): ResponseInterface
    {
        $userId      = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $firebaseUid = $this->request->getHeaderLine('X-Auth-FirebaseUid');
        $users       = model(\App\Models\UserModel::class);

        $archivo = $this->request->getFile('foto');
        if (! $archivo || ! $archivo->isValid()) {
            return $this->unprocessable(['foto' => 'Archivo de imagen requerido.']);
        }

        $mime = $archivo->getMimeType();
        if (! in_array($mime, ['image/jpeg', 'image/png'], true)) {
            return $this->unprocessable(['foto' => 'Solo se permiten imágenes JPEG o PNG.']);
        }

        if ($archivo->getSize() > 5 * 1024 * 1024) {
            return $this->unprocessable(['foto' => 'La imagen debe ser menor a 5MB.']);
        }

        $ext  = $mime === 'image/png' ? 'png' : 'jpg';
        $path = "publico/perfiles/{$firebaseUid}/avatar_{$userId}.{$ext}";

        $content = file_get_contents($archivo->getTempName());
        if ($content === false) {
            return $this->fail('No se pudo leer el archivo.', 500);
        }

        try {
            /** @var \App\Services\FirebaseStorageService $storage */
            $storage = service('firebaseStorage');
            $url = $storage->uploadAndGetUrl($path, $content, $mime);
        } catch (\Throwable $e) {
            log_message('error', 'Upload foto: ' . $e->getMessage());
            return $this->fail('Error al subir la imagen.', 500);
        }

        $users->update($userId, ['foto_perfil' => $url]);

        return $this->show();
    }

    /** GET /me/ofertas — Ofertas del usuario autenticado. */
    public function ofertas(): ResponseInterface
    {
        $userId  = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ofertas = model(\App\Models\OfertaModel::class)->porUsuario($userId);

        return $this->ok($ofertas);
    }
}
