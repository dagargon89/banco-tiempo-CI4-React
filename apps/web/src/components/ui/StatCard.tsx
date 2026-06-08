interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-surface p-4">
      <span className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-1'}`}>
        {value}
      </span>
      <span className="mt-1 text-xs text-text-3">{label}</span>
    </div>
  );
}
