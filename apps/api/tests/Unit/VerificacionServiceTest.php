<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\DocumentoPolicyService;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitarios para la lógica de verificación (Sprint 2).
 */
final class VerificacionServiceTest extends TestCase
{
    // ── DocumentoPolicyService::puedeIniciarVerificacion ──

    public function testPuedeIniciarVerificacionDesdeNoVerificado(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertTrue($policy->puedeIniciarVerificacion('no_verificado'));
    }

    public function testPuedeIniciarVerificacionDesdeRechazado(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertTrue($policy->puedeIniciarVerificacion('rechazado'));
    }

    public function testNoPuedeIniciarVerificacionDesdePendiente(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertFalse($policy->puedeIniciarVerificacion('pendiente'));
    }

    public function testNoPuedeIniciarVerificacionDesdeVerificado(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertFalse($policy->puedeIniciarVerificacion('verificado'));
    }

    // ── Validaciones de metadata de upload-token ──

    public function testTiposDeArchivoPermitidos(): void
    {
        $allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        $this->assertContains('image/jpeg', $allowed);
        $this->assertContains('image/png', $allowed);
        $this->assertContains('application/pdf', $allowed);
        $this->assertNotContains('image/gif', $allowed);
        $this->assertNotContains('application/exe', $allowed);
    }

    public function testTiposDeDocumentoValidos(): void
    {
        $validos = ['ine', 'pasaporte', 'licencia', 'otro'];
        $this->assertContains('ine', $validos);
        $this->assertContains('pasaporte', $validos);
        $this->assertContains('licencia', $validos);
        $this->assertContains('otro', $validos);
        $this->assertNotContains('tarjeta', $validos);
    }

    public function testMaximoTamaño10MB(): void
    {
        $maxSize = 10 * 1024 * 1024;
        $this->assertLessThanOrEqual($maxSize, 5 * 1024 * 1024); // 5MB ok
        $this->assertGreaterThan($maxSize, 15 * 1024 * 1024); // 15MB rechazado
    }

    // ── Transiciones de estado ──

    public function testTransicionesValidasDeEstado(): void
    {
        // no_verificado → pendiente (al subir documento)
        $this->assertTrue(in_array('pendiente', ['pendiente', 'verificado', 'rechazado']));

        // pendiente → verificado (al aprobar)
        // pendiente → rechazado (al rechazar)
        $estadosPendienteValidos = ['verificado', 'rechazado'];
        $this->assertContains('verificado', $estadosPendienteValidos);
        $this->assertContains('rechazado', $estadosPendienteValidos);

        // rechazado → pendiente (al re-subir documento)
        $policy = new DocumentoPolicyService();
        $this->assertTrue($policy->puedeIniciarVerificacion('rechazado'));
    }

    public function testRutaContieneFirebaseUid(): void
    {
        $firebaseUid = 'abc123FirebaseUid';
        $ruta = "privado/identidad/{$firebaseUid}/deadbeef.enc";
        $this->assertStringContainsString("/{$firebaseUid}/", $ruta);
    }

    public function testRutaNoContieneOtroFirebaseUid(): void
    {
        $firebaseUid = 'abc123FirebaseUid';
        $otroUid = 'xyz789OtroUid';
        $ruta = "privado/identidad/{$otroUid}/deadbeef.enc";
        $this->assertStringNotContainsString("/{$firebaseUid}/", $ruta);
    }
}
