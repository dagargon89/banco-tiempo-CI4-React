<?php

declare(strict_types=1);

namespace App\Services\Policies;

/**
 * Autorización a nivel de objeto para documentos de verificación (doc 04 A01).
 */
final class DocumentoPolicyService extends BasePolicyService
{
    /** Solo el dueño puede subir documentos de verificación. */
    public function puedeSubir(int $userId, int $documentoUserId): bool
    {
        return $userId === $documentoUserId;
    }

    /** Solo moderadores pueden revisar documentos. */
    public function puedeRevisar(array $roles): bool
    {
        return $this->esModerador($roles);
    }

    /** Solo moderadores pueden descargar el documento (URL firmada). */
    public function puedeDescargar(array $roles): bool
    {
        return $this->esModerador($roles);
    }
}
