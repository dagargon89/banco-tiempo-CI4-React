import { Users, ShieldCheck, Star, AlertTriangle } from 'lucide-react';
import BarChart from './components/BarChart';
import StatBlock from './components/StatBlock';
import { useMetricas } from './hooks/useAdminMetricas';

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2 text-text-3">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-1">{value}</p>
    </div>
  );
}

const vinculacionColor: Record<string, string> = {
  solicitada: 'warning',
  aceptada: 'info',
  completada: 'success',
  cancelada: 'neutral',
  rechazada: 'error',
};

export default function AdminMetricasPage() {
  const { data: metricas, isLoading } = useMetricas();

  if (isLoading || !metricas) {
    return (
      <>
        <h1 className="mb-6 font-display text-xl font-bold text-text-1">Dashboard de metricas</h1>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  const vinculacionesItems = Object.entries(metricas.vinculaciones_por_estado).map(([label, value]) => ({
    label,
    value: Number(value),
    color: vinculacionColor[label] ?? 'neutral',
  }));

  const tasaData = metricas.tasa_aceptacion_por_categoria.map((t) => ({
    label: t.categoria,
    value: t.total > 0 ? Math.round((Number(t.aceptadas) / Number(t.total)) * 100) : 0,
  }));

  return (
    <>
      <h1 className="mb-6 font-display text-xl font-bold text-text-1">Dashboard de metricas</h1>

      {/* Top stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Registrados" value={metricas.usuarios.registrados} />
        <StatCard icon={ShieldCheck} label="Verificados" value={metricas.usuarios.verificados} />
        <StatCard icon={Star} label="Calif. promedio" value={metricas.calificacion_promedio_plataforma} />
        <StatCard icon={AlertTriangle} label="Reportes" value={metricas.reportes.total_recibidos} />
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <BarChart
            title="Ofertas por categoria"
            data={metricas.ofertas_activas_por_categoria.map((c) => ({ label: c.categoria, value: Number(c.total) }))}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <StatBlock title="Vinculaciones por estado" items={vinculacionesItems} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <BarChart
            title="Registros por periodo"
            data={metricas.registros_por_periodo.map((r) => ({ label: r.periodo, value: Number(r.total) }))}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <BarChart
            title="Actividad por zona"
            data={metricas.actividad_por_zona.map((z) => ({
              label: z.zona,
              value: Number(z.ofertas) + Number(z.vinculaciones),
            }))}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <BarChart
            title="Tasa de aceptacion por categoria (%)"
            data={tasaData}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-1">Tiempo de resolucion</h3>
          <p className="text-3xl font-bold text-text-1">{metricas.reportes.horas_promedio_resolucion}h</p>
          <p className="text-xs text-text-3">Promedio de reportes resueltos</p>
        </div>
      </div>
    </>
  );
}
