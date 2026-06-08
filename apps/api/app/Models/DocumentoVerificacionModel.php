<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

final class DocumentoVerificacionModel extends Model
{
    protected $table         = 'documentos_verificacion';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;

    protected $allowedFields = ['user_id', 'ruta_cifrada', 'tipo_documento', 'content_type'];

    /** Documentos de un usuario específico. */
    public function porUsuario(int $userId): array
    {
        return $this->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }

    /** Documentos pendientes con datos del usuario (JOIN, evita N+1). */
    public function pendientesConUsuario(): array
    {
        return $this->select('documentos_verificacion.*, users.nombre, users.email, users.foto_perfil, users.fecha_nacimiento, users.genero, users.telefono')
            ->join('users', 'users.id = documentos_verificacion.user_id')
            ->where('documentos_verificacion.estado', 'pendiente')
            ->orderBy('documentos_verificacion.created_at', 'ASC')
            ->findAll();
    }

    /** Documento por ID con datos del usuario. */
    public function porIdConUsuario(int $id): ?array
    {
        return $this->select('documentos_verificacion.*, users.nombre, users.email, users.foto_perfil')
            ->join('users', 'users.id = documentos_verificacion.user_id')
            ->where('documentos_verificacion.id', $id)
            ->first();
    }
}
