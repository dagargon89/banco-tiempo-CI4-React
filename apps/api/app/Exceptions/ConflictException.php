<?php

declare(strict_types=1);

namespace App\Exceptions;

/**
 * Excepción de conflicto (HTTP 409). Usado para duplicados y transiciones inválidas.
 */
final class ConflictException extends \RuntimeException
{
}
