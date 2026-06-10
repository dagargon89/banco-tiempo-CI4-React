import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook helper para gestionar filtros en URL.
 *
 * `setFilter(key, value)` actualiza el parámetro `key` y resetea `page` cuando
 * se cambia cualquier otro filtro. Si `value` es null/'', se borra el parámetro.
 *
 * `setPage(p)` solo actualiza el parámetro `page` (sin tocar otros filtros).
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value) next.delete(key);
        else next.set(key, value);
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p > 1) next.set('page', String(p));
        else next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  return { searchParams, setFilter, setPage };
}
