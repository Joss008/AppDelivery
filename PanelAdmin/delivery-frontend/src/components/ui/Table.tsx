import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
  className?: string;
  render: (item: T) => ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (item: T) => void;
}

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyTitle = 'No hay registros disponibles',
  emptyDescription = 'Cuando se registren elementos aparecerán listados aquí.',
  emptyAction,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={[
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap',
                    ALIGN_CLASSES[col.align ?? 'left'],
                    col.className ?? '',
                  ].join(' ')}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`} className="bg-white">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 max-w-[160px] animate-pulse rounded bg-slate-200/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Inbox className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {emptyTitle}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {emptyDescription}
                    </p>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={[
                    'transition-colors duration-150 ease-out',
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-50/90'
                      : 'hover:bg-slate-50/60',
                  ].join(' ')}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-3 text-slate-700 align-middle',
                        ALIGN_CLASSES[col.align ?? 'left'],
                        col.numeric ? 'tabular-nums' : '',
                        col.className ?? '',
                      ].join(' ')}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
