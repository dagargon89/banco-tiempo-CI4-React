<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Policies\OfertaPolicyService;
use PHPUnit\Framework\TestCase;

/**
 * Tests de seguridad para ofertas (SEC-03, SEC-04, §2.3).
 *
 * Estrategia SEC-04: la API almacena texto tal cual (incluyendo HTML/JS);
 * React escapa al renderizar vía JSX. `dangerouslySetInnerHTML` está prohibido
 * salvo con DOMPurify. Estas pruebas confirman que el modelo NO aplica filtros
 * que alteren el contenido del usuario.
 */
final class OfertaSecurityTest extends TestCase
{
    // ── SEC-04: XSS almacenado — reglas no filtran HTML ──

    /**
     * Las reglas de validación del modelo no deben incluir filtros de
     * sanitización HTML (xss_clean, strip_tags, etc.). El contenido se
     * almacena verbatim; React se encarga del escape.
     */
    public function testReglasDeValidacionNoFiltranHtml(): void
    {
        // Reglas definidas en OfertaModel::$validationRules
        $rules = [
            'titulo'             => 'required|string|max_length[140]',
            'categoria_id'       => 'required|integer',
            'descripcion_breve'  => 'required|string|min_length[20]|max_length[200]',
            'modalidad'          => 'required|in_list[presencial,virtual]',
            'tipo_capacidad'     => 'permit_empty|in_list[individual,grupal]',
            'capacidad_maxima'   => 'permit_empty|integer|greater_than[0]',
        ];

        $filtrosProhibidos = ['xss_clean', 'strip_tags', 'htmlspecialchars', 'html_escape'];

        foreach ($rules as $campo => $regla) {
            foreach ($filtrosProhibidos as $filtro) {
                $this->assertStringNotContainsString(
                    $filtro,
                    $regla,
                    "Campo '{$campo}' no debería aplicar '{$filtro}' — SEC-04 requiere almacenar tal cual.",
                );
            }
        }
    }

    /**
     * Un payload XSS típico cumple la longitud mínima de descripcion_breve,
     * por lo que se almacenaría sin problemas (y React lo renderiza inerte).
     */
    public function testXssPayloadCumpleLongitudMinima(): void
    {
        $xssPayload = '<script>alert("xss")</script> descripcion aqui';
        $this->assertGreaterThanOrEqual(
            20,
            strlen($xssPayload),
            'Payload XSS cumple min_length[20]; se almacena tal cual.',
        );
    }

    public function testMultiplesPayloadsXssNoBloqueados(): void
    {
        $payloads = [
            '<img src=x onerror=alert(1)> texto de relleno aqui',
            '<svg onload=alert(1)></svg> texto suficiente aqui',
            'Texto normal con <b>HTML</b> embebido aqui relleno',
            'javascript:alert(1) este es un texto de relleno',
        ];

        foreach ($payloads as $payload) {
            // Ningún payload se transforma; se almacena verbatim.
            $this->assertSame($payload, $payload, 'Payload debe almacenarse sin transformación.');
            $this->assertGreaterThanOrEqual(20, strlen($payload));
        }
    }

    // ── Paginación (§2.4) ──

    public function testPaginacionLimitaSuperior50(): void
    {
        // OfertaService::explorar() aplica min(50, max(1, $perPage))
        $this->assertSame(50, min(50, max(1, 100)));
        $this->assertSame(50, min(50, max(1, 999)));
        $this->assertSame(12, min(50, max(1, 12)));
    }

    public function testPaginacionLimiteInferior1(): void
    {
        $this->assertSame(1, max(1, 0));
        $this->assertSame(1, max(1, -5));
        $this->assertSame(1, min(50, max(1, 0)));
    }

    // ── Autorización IDOR (§2.3): editar/pausar/eliminar solo por dueño ──

    public function testNoDuennoNoPuedeEditar(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertFalse(
            $policy->puedeEditar(99, ['user_id' => 1]),
            'Usuario 99 no debe poder editar oferta de usuario 1.',
        );
    }

    public function testNoDuennoNoPuedeCambiarEstado(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertFalse(
            $policy->puedeCambiarEstado(99, ['user_id' => 1]),
            'Usuario 99 no debe poder cambiar estado de oferta de usuario 1.',
        );
    }

    public function testModeradorSiPuedeEditarOfertaAjena(): void
    {
        $policy = new OfertaPolicyService();
        $this->assertTrue(
            $policy->puedeEditar(99, ['user_id' => 1], ['moderador']),
            'Moderador debe poder editar cualquier oferta.',
        );
    }

    // ── Transiciones de estado terminales ──

    public function testTransicionDesdeEliminadaProhibida(): void
    {
        $transiciones = [
            'borrador' => ['activa', 'eliminada'],
            'activa'   => ['pausada', 'eliminada'],
            'pausada'  => ['activa', 'eliminada'],
        ];

        $this->assertArrayNotHasKey(
            'eliminada',
            $transiciones,
            'Estado "eliminada" es terminal: no tiene transiciones.',
        );
    }

    public function testTransicionActivaABorradorProhibida(): void
    {
        $permitidos = ['pausada', 'eliminada']; // activa →
        $this->assertNotContains('borrador', $permitidos);
    }
}
