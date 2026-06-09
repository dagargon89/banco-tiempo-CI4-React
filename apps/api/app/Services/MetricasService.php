<?php

declare(strict_types=1);

namespace App\Services;

final class MetricasService
{
    private const CACHE_KEY = 'metricas_dashboard';
    private const CACHE_TTL = 300; // 5 minutos

    /** Obtiene las 8 métricas del dashboard con caché. */
    public function obtener(): array
    {
        $cached = cache(self::CACHE_KEY);
        if ($cached !== null) {
            return $cached;
        }

        $data = [
            'usuarios'                      => $this->usuarios(),
            'registros_por_periodo'         => $this->registrosPorPeriodo(),
            'ofertas_activas_por_categoria' => $this->ofertasActivasPorCategoria(),
            'vinculaciones_por_estado'      => $this->vinculacionesPorEstado(),
            'tasa_aceptacion_por_categoria' => $this->tasaAceptacionPorCategoria(),
            'calificacion_promedio_plataforma' => $this->calificacionPromedio(),
            'reportes'                      => $this->reportes(),
            'actividad_por_zona'            => $this->actividadPorZona(),
        ];

        cache()->save(self::CACHE_KEY, $data, self::CACHE_TTL);

        return $data;
    }

    private function db(): \CodeIgniter\Database\BaseConnection
    {
        return \Config\Database::connect();
    }

    /** Total registrados y verificados. */
    private function usuarios(): array
    {
        $row = $this->db()->table('users')
            ->select("COUNT(*) AS registrados, SUM(CASE WHEN estado_verificacion = 'verificado' THEN 1 ELSE 0 END) AS verificados")
            ->where('deleted_at IS NULL')
            ->get()
            ->getRowArray();

        return [
            'registrados' => (int) ($row['registrados'] ?? 0),
            'verificados' => (int) ($row['verificados'] ?? 0),
        ];
    }

    /** Registros por mes, últimos 12 meses. */
    private function registrosPorPeriodo(): array
    {
        $hace12 = date('Y-m-d', strtotime('-12 months'));

        return $this->db()->table('users')
            ->select("DATE_FORMAT(created_at, '%Y-%m') AS periodo, COUNT(*) AS total")
            ->where('deleted_at IS NULL')
            ->where('created_at >=', $hace12)
            ->groupBy('periodo')
            ->orderBy('periodo', 'ASC')
            ->get()
            ->getResultArray();
    }

    /** Ofertas activas agrupadas por categoría. */
    private function ofertasActivasPorCategoria(): array
    {
        return $this->db()->table('ofertas o')
            ->select('c.nombre AS categoria, COUNT(*) AS total')
            ->join('categorias c', 'c.id = o.categoria_id')
            ->where('o.estado', 'activa')
            ->groupBy('c.nombre')
            ->orderBy('total', 'DESC')
            ->get()
            ->getResultArray();
    }

    /** Distribución de vinculaciones por estado. */
    private function vinculacionesPorEstado(): array
    {
        $rows = $this->db()->table('vinculaciones')
            ->select('estado, COUNT(*) AS total')
            ->groupBy('estado')
            ->get()
            ->getResultArray();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['estado']] = (int) $row['total'];
        }
        return $result;
    }

    /** Tasa de aceptación por categoría: (aceptada+completada)/total. */
    private function tasaAceptacionPorCategoria(): array
    {
        return $this->db()->table('vinculaciones v')
            ->select("c.nombre AS categoria, COUNT(*) AS total, SUM(CASE WHEN v.estado IN ('aceptada','completada') THEN 1 ELSE 0 END) AS aceptadas")
            ->join('ofertas o', 'o.id = v.oferta_id')
            ->join('categorias c', 'c.id = o.categoria_id')
            ->groupBy('c.nombre')
            ->get()
            ->getResultArray();
    }

    /** Calificación promedio de la plataforma. */
    private function calificacionPromedio(): float
    {
        $row = $this->db()->table('resenas')
            ->select('AVG(calificacion) AS promedio')
            ->where('oculta', 0)
            ->get()
            ->getRowArray();

        return round((float) ($row['promedio'] ?? 0), 2);
    }

    /** Reportes: total recibidos y tiempo medio de resolución. */
    private function reportes(): array
    {
        $total = (int) $this->db()->table('tickets')
            ->where('tipo', 'reporte')
            ->countAllResults();

        $row = $this->db()->table('tickets')
            ->select('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) AS horas_promedio')
            ->where('tipo', 'reporte')
            ->where('estado', 'resuelto')
            ->get()
            ->getRowArray();

        return [
            'total_recibidos'       => $total,
            'horas_promedio_resolucion' => round((float) ($row['horas_promedio'] ?? 0), 1),
        ];
    }

    /** Actividad por zona: ofertas y vinculaciones, top 20. */
    private function actividadPorZona(): array
    {
        return $this->db()->query("
            SELECT zona,
                   SUM(ofertas) AS ofertas,
                   SUM(vinculaciones) AS vinculaciones
            FROM (
                SELECT u.zona, COUNT(*) AS ofertas, 0 AS vinculaciones
                FROM ofertas o
                JOIN users u ON u.id = o.user_id
                WHERE u.zona IS NOT NULL AND u.zona != ''
                GROUP BY u.zona

                UNION ALL

                SELECT u.zona, 0 AS ofertas, COUNT(*) AS vinculaciones
                FROM vinculaciones v
                JOIN users u ON u.id = v.buscador_id
                WHERE u.zona IS NOT NULL AND u.zona != ''
                GROUP BY u.zona
            ) t
            GROUP BY zona
            ORDER BY (SUM(ofertas) + SUM(vinculaciones)) DESC
            LIMIT 20
        ")->getResultArray();
    }
}
