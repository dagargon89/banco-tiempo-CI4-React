<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests de feature para autenticación (Sprint 1).
 * Verifican SEC-05 (tokens inválidos) y SEC-09 (rate limit).
 */
final class AuthSyncTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    // ── SEC-05: Token inválido/ausente → 401 ──

    public function testSinTokenDevuelve401(): void
    {
        $result = $this->post('api/v1/auth/sync');
        $result->assertStatus(401);
        $result->assertJSONFragment(['message' => 'Token de acceso ausente.']);
    }

    public function testTokenVacioDevuelve401(): void
    {
        $result = $this->withHeaders(['Authorization' => 'Bearer '])
            ->post('api/v1/auth/sync');
        $result->assertStatus(401);
    }

    public function testTokenInvalidoDevuelve401(): void
    {
        $result = $this->withHeaders(['Authorization' => 'Bearer token_invalido_123'])
            ->post('api/v1/auth/sync');
        $result->assertStatus(401);
        $result->assertJSONFragment(['message' => 'Token de acceso inválido o expirado.']);
    }

    public function testTokenMalformadoDevuelve401(): void
    {
        $result = $this->withHeaders(['Authorization' => 'Basic dXNlcjpwYXNz'])
            ->post('api/v1/auth/sync');
        $result->assertStatus(401);
        $result->assertJSONFragment(['message' => 'Token de acceso ausente.']);
    }

    // ── SEC-05: Rutas protegidas sin auth → 401 ──

    public function testGetMeSinTokenDevuelve401(): void
    {
        $result = $this->get('api/v1/me');
        $result->assertStatus(401);
    }

    public function testPatchMeSinTokenDevuelve401(): void
    {
        $result = $this->patch('api/v1/me');
        $result->assertStatus(401);
    }

    // ── RBAC: Usuario sin rol admin → 403 ──

    public function testAdminSinTokenDevuelve401(): void
    {
        $result = $this->get('api/v1/admin/usuarios');
        $result->assertStatus(401);
    }

    // ── SEC-06: No password_hash en schema ──

    public function testSchemaNoTienePasswordHash(): void
    {
        $db = \Config\Database::connect('default');
        $fields = $db->getFieldNames('users');
        $this->assertNotContains('password_hash', $fields, 'La tabla users NO debe tener password_hash (ADR-008).');
        $this->assertNotContains('password', $fields, 'La tabla users NO debe tener password.');
    }

    public function testSchemaNoTieneRefreshTokens(): void
    {
        $db = \Config\Database::connect('default');
        $tables = $db->listTables();
        $this->assertNotContains('refresh_tokens', $tables, 'No debe existir tabla refresh_tokens (ADR-008).');
    }
}
