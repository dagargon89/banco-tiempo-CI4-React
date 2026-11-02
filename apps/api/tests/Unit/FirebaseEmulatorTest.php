<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\FirebaseEmulator;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Soporte de Firebase Emulator Suite para desarrollo local.
 */
final class FirebaseEmulatorTest extends CIUnitTestCase
{
    private const VARS = ['FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST', 'FIREBASE_PROJECT_ID'];

    /** @var array<string, array{env: mixed, server: mixed, getenv: string|false}> */
    private array $backup = [];

    protected function setUp(): void
    {
        parent::setUp();
        foreach (self::VARS as $name) {
            $this->backup[$name] = ['env' => $_ENV[$name] ?? null, 'server' => $_SERVER[$name] ?? null, 'getenv' => getenv($name)];
            $this->setVar($name, null);
        }
    }

    protected function tearDown(): void
    {
        foreach ($this->backup as $name => $orig) {
            unset($_ENV[$name], $_SERVER[$name]);
            putenv($name);
            if ($orig['env'] !== null) {
                $_ENV[$name] = $orig['env'];
            }
            if ($orig['server'] !== null) {
                $_SERVER[$name] = $orig['server'];
            }
            if ($orig['getenv'] !== false) {
                putenv("{$name}={$orig['getenv']}");
            }
        }
        parent::tearDown();
    }

    public function testDesactivadoSinVariables(): void
    {
        $this->assertNull(FirebaseEmulator::authHost());
        $this->assertNull(FirebaseEmulator::storageHost());
    }

    public function testActivadoConVariables(): void
    {
        $this->setVar('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:9099');
        $this->setVar('FIREBASE_STORAGE_EMULATOR_HOST', '127.0.0.1:9199');

        $this->assertSame('127.0.0.1:9099', FirebaseEmulator::authHost());
        $this->assertSame('127.0.0.1:9199', FirebaseEmulator::storageHost());
    }

    public function testProjectIdObligatorio(): void
    {
        $this->expectException(\RuntimeException::class);
        FirebaseEmulator::projectId();
    }

    public function testCustomTokenSinFirmaConClaimDeConversacion(): void
    {
        $token = FirebaseEmulator::customToken('uid-123', ['conversation_id' => 'chat_vinc_1_abc'], 600);

        $partes = explode('.', $token);
        $this->assertCount(3, $partes);
        $this->assertSame('', $partes[2], 'El emulador espera un token sin firma.');

        $header  = $this->decode($partes[0]);
        $payload = $this->decode($partes[1]);

        $this->assertSame('none', $header['alg']);
        $this->assertSame('uid-123', $payload['uid']);
        $this->assertSame(['conversation_id' => 'chat_vinc_1_abc'], $payload['claims']);
        $this->assertSame('firebase-auth-emulator@example.com', $payload['iss']);
        $this->assertSame(600, $payload['exp'] - $payload['iat']);
    }

    private function setVar(string $name, ?string $value): void
    {
        unset($_ENV[$name], $_SERVER[$name]);
        putenv($name);
        if ($value !== null) {
            $_ENV[$name] = $_SERVER[$name] = $value;
            putenv("{$name}={$value}");
        }
    }

    /** @return array<string, mixed> */
    private function decode(string $segmento): array
    {
        return (array) json_decode((string) base64_decode(strtr($segmento, '-_', '+/'), true), true);
    }
}
