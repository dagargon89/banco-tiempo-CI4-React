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

    /** Campos JSON multi-valor que se guardan/leen como array. */
    private const JSON_FIELDS = [
        'modalidades_preferidas', 'habilidades_enseno', 'quiere_aprender',
        'franjas_horarias', 'dias_disponibles', 'idiomas', 'causas',
    ];

    /** Campos booleanos almacenados como TINYINT(1). */
    private const BOOL_FIELDS = [
        'mostrar_edad', 'mostrar_zona', 'mostrar_habilidades', 'permitir_contacto_directo',
    ];

    /** Todos los campos que el usuario puede modificar vía PATCH /me. */
    private const UPDATABLE = [
        'nombre', 'bio', 'foto_perfil', 'zona', 'fecha_nacimiento', 'genero', 'telefono',
        'modalidades_preferidas', 'habilidades_enseno', 'quiere_aprender',
        'franjas_horarias', 'dias_disponibles', 'frecuencia',
        'pronombres', 'idiomas', 'causas', 'anios_en_juarez', 'ocupacion_general',
        'mostrar_edad', 'mostrar_zona', 'mostrar_habilidades', 'permitir_contacto_directo', 'contacto_preferido',
    ];

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
            'id'                        => (int) $u['id'],
            'nombre'                    => $u['nombre'],
            'email'                     => $u['email'],
            'bio'                       => $u['bio'] ?? '',
            'foto_perfil'               => $u['foto_perfil'] ?? null,
            'zona'                      => $u['zona'] ?? null,
            'fecha_nacimiento'          => $u['fecha_nacimiento'] ?? null,
            'genero'                    => $u['genero'] ?? null,
            'telefono'                  => $u['telefono'] ?? null,
            // Grupo A
            'modalidades_preferidas'    => $this->decodeJsonField($u['modalidades_preferidas'] ?? null),
            'habilidades_enseno'        => $this->decodeJsonField($u['habilidades_enseno'] ?? null),
            'quiere_aprender'           => $this->decodeJsonField($u['quiere_aprender'] ?? null),
            // Grupo B
            'franjas_horarias'          => $this->decodeJsonField($u['franjas_horarias'] ?? null),
            'dias_disponibles'          => $this->decodeJsonField($u['dias_disponibles'] ?? null),
            'frecuencia'                => $u['frecuencia'] ?? null,
            // Grupo C+E
            'pronombres'                => $u['pronombres'] ?? null,
            'idiomas'                   => $this->decodeJsonField($u['idiomas'] ?? null),
            'causas'                    => $this->decodeJsonField($u['causas'] ?? null),
            'anios_en_juarez'           => $u['anios_en_juarez'] ?? null,
            'ocupacion_general'         => $u['ocupacion_general'] ?? null,
            // Grupo D
            'mostrar_edad'              => (bool) ($u['mostrar_edad'] ?? 0),
            'mostrar_zona'              => (bool) ($u['mostrar_zona'] ?? 1),
            'mostrar_habilidades'       => (bool) ($u['mostrar_habilidades'] ?? 1),
            'permitir_contacto_directo' => (bool) ($u['permitir_contacto_directo'] ?? 0),
            'contacto_preferido'        => $u['contacto_preferido'] ?? 'plataforma',

            'email_verificado'          => $u['email_verified_at'] !== null,
            'estado_verificacion'       => $u['estado_verificacion'],
            'estado_cuenta'             => $u['estado_cuenta'],
            'roles'                     => $roles,
            'created_at'                => $u['created_at'],
        ]);
    }

    public function update(): ResponseInterface
    {
        $userId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $users  = model(\App\Models\UserModel::class);

        $data    = $this->request->getJSON(true) ?? [];
        $allowed = array_intersect_key($data, array_flip(self::UPDATABLE));

        if ($allowed === []) {
            return $this->fail('No hay campos válidos para actualizar.');
        }

        // Serializar JSON fields y normalizar booleans para que coincidan con la BD.
        foreach (self::JSON_FIELDS as $f) {
            if (array_key_exists($f, $allowed)) {
                $allowed[$f] = $allowed[$f] === null ? null : json_encode(array_values((array) $allowed[$f]), JSON_UNESCAPED_UNICODE);
            }
        }
        foreach (self::BOOL_FIELDS as $f) {
            if (array_key_exists($f, $allowed)) {
                $allowed[$f] = $allowed[$f] ? 1 : 0;
            }
        }

        if (! $users->update($userId, $allowed)) {
            return $this->unprocessable($users->errors());
        }

        return $this->show();
    }

    /** @return array<int, mixed>|null */
    private function decodeJsonField(?string $raw): ?array
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
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
