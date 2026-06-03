<?php

declare(strict_types=1);

namespace App\Traits;

use CodeIgniter\HTTP\ResponseInterface;

/** Envelope JSON consistente (doc 05 §1.4). No filtra detalles internos (A05/A09). */
trait ApiResponder
{
    protected function ok(mixed $data, array $meta = [], int $code = 200): ResponseInterface
    {
        $body = ['data' => $data];
        if ($meta !== []) { $body['meta'] = $meta; }
        return $this->response->setStatusCode($code)->setJSON($body);
    }
    protected function created(mixed $data): ResponseInterface
    {
        return $this->response->setStatusCode(201)->setJSON(['data' => $data]);
    }
    protected function fail(string $message, int $code = 400, array $errors = []): ResponseInterface
    {
        $body = ['message' => $message];
        if ($errors !== []) { $body['errors'] = $errors; }
        return $this->response->setStatusCode($code)->setJSON($body);
    }
    protected function unprocessable(array $errors, string $m = 'La validación falló.'): ResponseInterface { return $this->fail($m, 422, $errors); }
    protected function conflict(string $m): ResponseInterface { return $this->fail($m, 409); }
    protected function forbidden(string $m = 'No autorizado.'): ResponseInterface { return $this->fail($m, 403); }
    protected function notFound(string $m = 'Recurso no encontrado.'): ResponseInterface { return $this->fail($m, 404); }
}
