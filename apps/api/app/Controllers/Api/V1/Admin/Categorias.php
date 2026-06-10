<?php

declare(strict_types=1);

namespace App\Controllers\Api\V1\Admin;

use App\Models\AuditoriaModel;
use App\Models\CategoriaModel;
use App\Traits\ApiResponder;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\ResponseInterface;

final class Categorias extends Controller
{
    use ApiResponder;

    /** POST /admin/categorias */
    public function create(): ResponseInterface
    {
        $moderadorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $ip          = $this->request->getIPAddress();
        $body        = $this->request->getJSON(true) ?? [];

        $nombre = trim($body['nombre'] ?? '');
        if ($nombre === '' || mb_strlen($nombre) > 80) {
            return $this->unprocessable(['nombre' => 'El nombre es obligatorio y máximo 80 caracteres.']);
        }

        $slug = url_title($nombre, '-', true);

        $categoriaModel = model(CategoriaModel::class);

        // Verificar unicidad por nombre
        $existente = $categoriaModel->where('nombre', $nombre)->first();
        if ($existente !== null) {
            return $this->conflict('Ya existe una categoría con ese nombre.');
        }

        $categoriaModel->insert([
            'nombre' => $nombre,
            'slug'   => $slug,
            'activa' => 1,
        ]);
        $categoriaId = (int) $categoriaModel->getInsertID();

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar($moderadorId, 'admin_crear_categoria', 'categorias', $categoriaId, [
            'nombre' => $nombre,
            'slug'   => $slug,
        ], $ip);

        $categoria = $categoriaModel->find($categoriaId);

        return $this->created($categoria);
    }

    /** PATCH /admin/categorias/{id} */
    public function update(int $id): ResponseInterface
    {
        $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $body    = $this->request->getJSON(true) ?? [];
        $nombre  = trim((string) ($body['nombre'] ?? ''));

        if ($nombre === '' || mb_strlen($nombre) > 80) {
            return $this->unprocessable(['nombre' => 'Nombre requerido (1-80 chars).']);
        }

        $cats = model(CategoriaModel::class);
        $cat  = $cats->find($id);
        if ($cat === null) {
            return $this->notFound('Categoría no encontrada.');
        }

        // Generar slug a partir del nombre.
        $slug = $this->slugify($nombre);

        // Validar slug único (excepto este id)
        $duplicate = $cats->where('slug', $slug)->where('id !=', $id)->first();
        if ($duplicate !== null) {
            return $this->conflict('Ya existe una categoría con ese nombre.');
        }

        $cats->update($id, ['nombre' => $nombre, 'slug' => $slug]);

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar(
            $actorId,
            'admin_editar_categoria',
            'categoria',
            $id,
            ['antes' => ['nombre' => $cat['nombre'], 'slug' => $cat['slug']], 'despues' => ['nombre' => $nombre, 'slug' => $slug]],
            $this->request->getIPAddress(),
        );

        return $this->ok($cats->find($id));
    }

    /** PATCH /admin/categorias/{id}/activa */
    public function toggleActiva(int $id): ResponseInterface
    {
        $actorId = (int) $this->request->getHeaderLine('X-Auth-UserId');
        $body    = $this->request->getJSON(true) ?? [];

        if (!array_key_exists('activa', $body)) {
            return $this->unprocessable(['activa' => 'Campo requerido (boolean).']);
        }
        $activa = (bool) $body['activa'];

        $cats = model(CategoriaModel::class);
        $cat  = $cats->find($id);
        if ($cat === null) {
            return $this->notFound('Categoría no encontrada.');
        }

        $cats->update($id, ['activa' => $activa ? 1 : 0]);

        $auditoria = model(AuditoriaModel::class);
        $auditoria->registrar(
            $actorId,
            'admin_toggle_categoria',
            'categoria',
            $id,
            ['activa_antes' => (int) $cat['activa'], 'activa_despues' => $activa ? 1 : 0],
            $this->request->getIPAddress(),
        );

        return $this->ok($cats->find($id));
    }

    /** Genera un slug ASCII-safe a partir del nombre (translit + lowercase + guiones). */
    private function slugify(string $text): string
    {
        // Reemplazo explícito de caracteres acentuados comunes (es-MX). Más fiable
        // que iconv//TRANSLIT, cuyo comportamiento depende de la locale del sistema.
        $map = [
            'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ã' => 'a',
            'Á' => 'a', 'À' => 'a', 'Ä' => 'a', 'Â' => 'a', 'Ã' => 'a',
            'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e',
            'É' => 'e', 'È' => 'e', 'Ë' => 'e', 'Ê' => 'e',
            'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i',
            'Í' => 'i', 'Ì' => 'i', 'Ï' => 'i', 'Î' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'õ' => 'o',
            'Ó' => 'o', 'Ò' => 'o', 'Ö' => 'o', 'Ô' => 'o', 'Õ' => 'o',
            'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u',
            'Ú' => 'u', 'Ù' => 'u', 'Ü' => 'u', 'Û' => 'u',
            'ñ' => 'n', 'Ñ' => 'n',
            'ç' => 'c', 'Ç' => 'c',
        ];
        $text = strtr($text, $map);
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';

        return trim($text, '-');
    }
}
