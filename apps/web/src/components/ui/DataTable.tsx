import type { ReactNode } from 'react';
import { TableRowSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  hideOnMobile?: boolean;
  mobileLabel?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  rowKey: (row: T) => string | number;
  renderExpandedRow?: (row: T) => ReactNode;
  expandedRowId?: string | number | null;
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  skeletonRows = 5,
  emptyTitle = 'Sin resultados',
  emptySubtitle = 'No se encontraron registros.',
  rowKey,
  renderExpandedRow,
  expandedRowId,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-text-2">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRowSkeleton key={i} cols={columns.length} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="space-y-3 md:hidden">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 h-4 w-3/4 rounded bg-surface-2" />
              <div className="space-y-2">
                <div className="h-3 w-1/2 rounded bg-surface-2" />
                <div className="h-3 w-2/3 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const mobileColumns = columns.filter((c) => !c.hideOnMobile);
  const titleCol = mobileColumns[0];
  const detailCols = mobileColumns.slice(1);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-text-2">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">{col.header}</th>
              ))}
            </tr>
          </thead>
          {data.map((row) => {
              const key = rowKey(row);
              const isExpanded = expandedRowId != null && expandedRowId === key;
              return (
                <tbody key={key} className="border-b border-border bg-surface last:border-b-0">
                  <tr className="group">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">{col.render(row)}</td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow && (
                    <tr>
                      <td colSpan={columns.length} className="bg-surface-2 px-4 py-3">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => {
          const key = rowKey(row);
          const isExpanded = expandedRowId != null && expandedRowId === key;
          return (
            <div key={key} className="rounded-xl border border-border bg-surface p-4">
              {titleCol && (
                <div className="mb-2 font-medium text-text-1">{titleCol.render(row)}</div>
              )}
              <div className="space-y-1.5">
                {detailCols.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-2 text-sm">
                    <span className="shrink-0 text-text-3">{col.mobileLabel ?? col.header}</span>
                    <span className="text-right text-text-1">{col.render(row)}</span>
                  </div>
                ))}
              </div>
              {isExpanded && renderExpandedRow && (
                <div className="mt-3 border-t border-border pt-3">
                  {renderExpandedRow(row)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
