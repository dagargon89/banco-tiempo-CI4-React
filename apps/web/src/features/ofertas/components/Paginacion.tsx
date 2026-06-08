import Button from '@/components/ui/Button';

interface PaginacionProps {
  page: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function Paginacion({ page, total, perPage, onChange }: PaginacionProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="text-sm text-text-2">
        {page} / {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </div>
  );
}
