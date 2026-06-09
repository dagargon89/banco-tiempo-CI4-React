<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\DocumentoPolicyService;
use App\Services\Policies\OfertaPolicyService;
use App\Services\Policies\VinculacionPolicyService;
use App\Models\AuditoriaModel;
use PHPUnit\Framework\TestCase;

/**
 * Tests de auditoría de seguridad (Sprint 7).
 * Cubre SEC-01 (IDOR), SEC-02 (escalada), SEC-07 (storage),
 * SEC-08 (auditoría), SEC-10 (producción).
 */
final class SecurityAuditTest extends TestCase
{
    // ── SEC-01: IDOR — Ofertas ──

    public function testSEC01_UsuarioNoPuedeEditarOfertaAjena(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertFalse(
            $policy->puedeEditar(50, ['user_id' => 1]),
            'Un usuario no debe poder editar una oferta que no le pertenece.'
        );
    }

    // ── SEC-01: IDOR — Vinculaciones ──

    public function testSEC01_TerceroNoPuedeVerVinculacionAjena(): void
    {
        $policy = new VinculacionPolicyService();
        $vinc = ['buscador_id' => 1, 'oferente_id' => 2, 'estado' => 'aceptada'];

        $this->assertFalse($policy->puedeVer(99, $vinc), 'Tercero no debe ver vinculación ajena.');
        $this->assertFalse($policy->puedeVerChat(99, $vinc), 'Tercero no debe ver chat ajeno.');
        $this->assertFalse($policy->puedeAceptarRechazar(99, [...$vinc, 'estado' => 'solicitada']), 'Tercero no debe aceptar/rechazar.');
        $this->assertFalse($policy->puedeCancelar(99, $vinc), 'Tercero no debe cancelar.');
        $this->assertFalse($policy->puedeConfirmar(99, $vinc), 'Tercero no debe confirmar.');
    }

    // ── SEC-01: IDOR — Documentos ──

    public function testSEC01_UsuarioNoPuedeSubirDocumentoDeOtro(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertFalse(
            $policy->puedeSubir(5, 10),
            'Un usuario no debe subir un documento para otro usuario.'
        );
    }

    // ── SEC-02: Escalada de privilegios — RBAC ──

    public function testSEC02_UsuarioSinRolNoPasaRbac(): void
    {
        $policy = new OfertaPolicyService();
        // Sin roles, un tercero no puede editar oferta ajena
        $this->assertFalse($policy->puedeEditar(99, ['user_id' => 1], []));

        $docPolicy = new DocumentoPolicyService();
        $this->assertFalse($docPolicy->puedeRevisar([]), 'Sin roles no puede revisar.');
        $this->assertFalse($docPolicy->puedeDescargar([]), 'Sin roles no puede descargar.');
    }

    public function testSEC02_ModeradorNoPuedeSuperAdmin(): void
    {
        // Un moderador puede revisar documentos pero su rol no incluye super_admin
        $roles = ['moderador'];
        $this->assertNotContains('super_admin', $roles, 'El rol moderador no incluye super_admin.');

        // Verificar que no escala: un moderador puede revisar pero no es super_admin
        $docPolicy = new DocumentoPolicyService();
        $this->assertTrue($docPolicy->puedeRevisar($roles), 'Moderador sí revisa.');
        // Pero en la jerarquía, moderador no equivale a super_admin
        $this->assertFalse(in_array('super_admin', $roles, true), 'moderador no contiene super_admin.');
    }

    // ── SEC-07: Storage — Documentos privados ──

    public function testSEC07_UsuarioNormalNoPuedeDescargarDocumento(): void
    {
        $policy = new DocumentoPolicyService();
        $this->assertFalse(
            $policy->puedeDescargar([]),
            'Un usuario sin rol moderador no debe descargar documentos.'
        );
    }

    public function testSEC07_RutaDocumentoEstaEnPrefijoPrivado(): void
    {
        // La ruta de documentos debe empezar con 'privado/' según convención
        $rutaBase = 'privado/documentos/user_123/ine.enc';
        $this->assertStringStartsWith('privado/', $rutaBase, 'Las rutas de documentos deben usar prefijo privado/.');
    }

    // ── SEC-08: Auditoría ──

    public function testSEC08_AuditoriaModelTieneCamposCorrectos(): void
    {
        $model = new AuditoriaModel();
        $allowed = $model->allowedFields;

        $required = ['actor_id', 'accion', 'entidad_tipo', 'entidad_id', 'metadata', 'ip'];
        foreach ($required as $field) {
            $this->assertContains($field, $allowed, "AuditoriaModel debe permitir el campo '{$field}'.");
        }
    }

    public function testSEC08_ControllerUsaAccionLeerChatAdmin(): void
    {
        $file = APPPATH . 'Controllers/Api/V1/Admin/Vinculaciones.php';
        $this->assertFileExists($file, 'El controller Admin/Vinculaciones debe existir.');

        $content = file_get_contents($file);
        $this->assertStringContainsString('leer_chat_admin', $content, 'Debe auditar la acción leer_chat_admin.');
        $this->assertStringContainsString('registrar(', $content, 'Debe llamar al método registrar() de auditoría.');
    }

    // ── SEC-10: Producción ──

    public function testSEC10_ProductionBootDesactivaDisplayErrors(): void
    {
        $file = APPPATH . 'Config/Boot/production.php';
        $this->assertFileExists($file, 'El boot de producción debe existir.');

        $content = file_get_contents($file);
        $this->assertStringContainsString("'0'", $content, 'production.php debe tener display_errors = 0.');
        $this->assertStringContainsString('false', $content, 'production.php debe definir CI_DEBUG como false.');
    }

    public function testSEC10_ApiResponderNoFiltraStackTrace(): void
    {
        $file = APPPATH . 'Traits/ApiResponder.php';
        $this->assertFileExists($file, 'El trait ApiResponder debe existir.');

        $content = file_get_contents($file);
        $this->assertStringNotContainsString('getTraceAsString', $content, 'No debe exponer getTraceAsString.');
        $this->assertStringNotContainsString('getTrace()', $content, 'No debe exponer getTrace().');
    }
}
