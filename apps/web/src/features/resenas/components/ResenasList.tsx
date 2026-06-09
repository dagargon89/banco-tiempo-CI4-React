import { useState } from 'react';
import { Star } from 'lucide-react';
import { useResenasDeUsuario } from '../hooks/useResenas';
import ResenaCard from './ResenaCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

interface Props {
  userId: number;
}

export default function ResenasList({ userId }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useResenasDeUsuario(userId, page);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const resenas = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const perPage = data?.meta?.per_page ?? 10;
  const totalPages = Math.ceil(total / perPage);

  if (resenas.length === 0) {
    return (
      <EmptyState
        icon={<Star className="h-8 w-8" />}
        title="Sin resenas aun"
        subtitle="Las resenas apareceran despues de completar actividades"
      />
    );
  }

  return (
    <div className="space-y-3">
      {resenas.map((r) => (
        <ResenaCard key={r.id} resena={r} />
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="subtle"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center text-xs text-text-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="subtle"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
