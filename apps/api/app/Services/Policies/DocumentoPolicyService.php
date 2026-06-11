<?php

declare(strict_types=1);

namespace App\Services\Policies;

/**
 * Autorización a nivel de objeto para documentos de verificación (doc 04 A01).
 */
final class DocumentoPolicyService extends BasePolicyService
{
    /** Verifica si el usuario puede iniciar verificación según su estado actual. */
    public function puedeIniciarVerificacion(string $estadoVerificacion): bool
    {
        return in_array($estadoVerificacion, ['no_verificado', 'rechazado'], true);
    }

    /** Solo el dueño puede subir documentos de verificación. */
    public function puedeSubir(int $userId, int $documentoUserId): bool
    {
        return $userId === $documentoUserId;
    }

    /** Moderadores y verificadores pueden revisar documentos. */
    public function puedeRevisar(array $roles): bool
    {
        return $this->esModerador($roles) || $this->tieneRol($roles, 'verificador');
    }

    /** Moderadores y verificadores pueden descargar el documento (URL firmada). */
    public function puedeDescargar(array $roles): bool
    {
        return $this->esModerador($roles) || $this->tieneRol($roles, 'verificador');
    }
}
