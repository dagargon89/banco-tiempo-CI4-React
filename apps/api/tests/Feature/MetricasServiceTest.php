<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\MetricasService;
use CodeIgniter\Test\CIUnitTestCase;

final class MetricasServiceTest extends CIUnitTestCase
{
    private MetricasService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MetricasService();
    }

    /** Verificar estructura de respuesta (8 claves presentes) */
    public function testEstructuraRespuestaContieneOchoClaves(): void
    {
        $data = $this->service->obtener();

        $expectedKeys = [
            'usuarios',
            'registros_por_periodo',
            'ofertas_activas_por_categoria',
            'vinculaciones_por_estado',
            'tasa_aceptacion_por_categoria',
            'calificacion_promedio_plataforma',
            'reportes',
            'actividad_por_zona',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $data, "Falta la clave: {$key}");
        }
    }

    /** Verificar tipos de datos de cada métrica */
    public function testTiposDeDatoCorrectos(): void
    {
        $data = $this->service->obtener();

        // usuarios: array con registrados y verificados
        $this->assertIsArray($data['usuarios']);
        $this->assertArrayHasKey('registrados', $data['usuarios']);
        $this->assertArrayHasKey('verificados', $data['usuarios']);
        $this->assertIsInt($data['usuarios']['registrados']);
        $this->assertIsInt($data['usuarios']['verificados']);

        // registros_por_periodo: array de arrays
        $this->assertIsArray($data['registros_por_periodo']);

        // ofertas_activas_por_categoria: array de arrays
        $this->assertIsArray($data['ofertas_activas_por_categoria']);

        // vinculaciones_por_estado: array asociativo
        $this->assertIsArray($data['vinculaciones_por_estado']);

        // tasa_aceptacion_por_categoria: array de arrays
        $this->assertIsArray($data['tasa_aceptacion_por_categoria']);

        // calificacion_promedio_plataforma: float
        $this->assertIsFloat($data['calificacion_promedio_plataforma']);

        // reportes: array con total_recibidos y horas_promedio_resolucion
        $this->assertIsArray($data['reportes']);
        $this->assertArrayHasKey('total_recibidos', $data['reportes']);
        $this->assertArrayHasKey('horas_promedio_resolucion', $data['reportes']);

        // actividad_por_zona: array
        $this->assertIsArray($data['actividad_por_zona']);
    }
}
