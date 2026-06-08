<?php

declare(strict_types=1);

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Tests de feature para PATCH /me (Sprint 2).
 */
final class MeUpdateTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testPatchMeSinAuthDevuelve401(): void
    {
        $result = $this->patch('api/v1/me');
        $result->assertStatus(401);
    }

    public function testGetMeSinAuthDevuelve401(): void
    {
        $result = $this->get('api/v1/me');
        $result->assertStatus(401);
    }
}
