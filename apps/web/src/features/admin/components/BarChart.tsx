interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
}

export default function BarChart({ data, title }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-text-1">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-text-3">Sin datos</p>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-text-2" title={item.label}>
                {item.label}
              </span>
              <div className="flex-1">
                <div
                  className="h-5 rounded bg-accent/20"
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
                >
                  <div
                    className="h-full rounded bg-accent transition-all duration-300"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-xs font-medium text-text-1">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
