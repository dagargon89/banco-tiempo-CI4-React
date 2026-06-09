interface StatBlockItem {
  label: string;
  value: number;
  color: string;
}

interface StatBlockProps {
  title: string;
  items: StatBlockItem[];
}

const colorMap: Record<string, string> = {
  warning: 'bg-warning/20 text-warning',
  info: 'bg-info/20 text-info',
  success: 'bg-success/20 text-success',
  neutral: 'bg-surface-2 text-text-2',
  error: 'bg-error/20 text-error',
};

export default function StatBlock({ title, items }: StatBlockProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-text-1">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-3">Sin datos</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg px-3 py-2 text-center ${colorMap[item.color] ?? colorMap.neutral}`}
            >
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs capitalize">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
