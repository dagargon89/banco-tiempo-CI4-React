import { Users, ShieldCheck, Star, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
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

const PIE_COLORS = ['var(--warning)', 'var(--info)', 'var(--success)', 'var(--text-3)', 'var(--error)'];

const tooltipStyle = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: 'var(--text-1)', fontWeight: 600 },
};

export default function AdminMetricasPage() {
  const { data: metricas, isLoading } = useMetricas();

  if (isLoading || !metricas) {
    return (
      <>
        <h1 className="mb-6 font-display text-xl font-bold text-text-1">Dashboard de metricas</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </>
    );
  }

  const ofertasPorCategoria = metricas.ofertas_activas_por_categoria.map((c) => ({
    name: c.categoria,
    value: Number(c.total),
  }));

  const vinculacionesPorEstado = Object.entries(metricas.vinculaciones_por_estado).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const registrosPorPeriodo = metricas.registros_por_periodo.map((r) => ({
    name: r.periodo,
    total: Number(r.total),
  }));

  const actividadPorZona = metricas.actividad_por_zona.map((z) => ({
    name: z.zona,
    ofertas: Number(z.ofertas),
    vinculaciones: Number(z.vinculaciones),
  }));

  const tasaAceptacion = metricas.tasa_aceptacion_por_categoria.map((t) => ({
    name: t.categoria,
    tasa: t.total > 0 ? Math.round((Number(t.aceptadas) / Number(t.total)) * 100) : 0,
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
        {/* Ofertas por categoria */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-1">Ofertas por categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ofertasPorCategoria} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vinculaciones por estado */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-1">Vinculaciones por estado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={vinculacionesPorEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {vinculacionesPorEstado.map((_entry, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Registros por periodo */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-1">Registros por periodo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={registrosPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Actividad por zona */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-1">Actividad por zona</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={actividadPorZona}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="ofertas" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Ofertas" />
              <Bar dataKey="vinculaciones" fill="var(--accent-2)" radius={[4, 4, 0, 0]} name="Vinculaciones" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasa de aceptacion */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-1">Tasa de aceptacion por categoria (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tasaAceptacion}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} domain={[0, 100]} />
              <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="tasa" fill="var(--success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tiempo de resolucion */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-1">Tiempo de resolucion</h3>
          <p className="text-3xl font-bold text-text-1">{metricas.reportes.horas_promedio_resolucion}h</p>
          <p className="text-xs text-text-3">Promedio de reportes resueltos</p>
        </div>
      </div>
    </>
  );
}
