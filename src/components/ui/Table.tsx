import React, { useState } from 'react';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField?: keyof T;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
  actions?: React.ReactNode;
  loading?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

function Table<T extends object>({
  columns,
  data,
  keyField,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data yet',
  emptySubMessage = '',
  actions,
  loading = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [search, setSearch] = useState('');

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getValue = (row: T, key: string): unknown => (row as any)[key];

  const filtered = searchable && search.trim()
    ? data.filter(row =>
        columns.some(col => {
          const val = getValue(row, String(col.key));
          return typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = getValue(a, sortKey);
        const bv = getValue(b, sortKey);
        if (typeof av === 'string' && typeof bv === 'string') {
          return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return 0;
      })
    : filtered;

  const SortIcon = ({ col }: { col: ColumnDef<T> }) => {
    if (!col.sortable) return null;
    const isActive = sortKey === col.key;
    return (
      <span className={`ml-1.5 inline-block transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50'}`}>
        {isActive && sortDir === 'desc' ? '↓' : '↑'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {(searchable || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchable && (
            <div className="relative max-w-xs w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-md bg-surface border border-transparent hover:border-border focus:border-border pl-9 pr-3 text-body focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background placeholder:text-muted-foreground/60 text-foreground transition-colors"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-border-subtle">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  className={`group px-3 py-2.5 text-left font-medium text-label whitespace-nowrap first:pl-0 last:pr-0 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                >
                  {col.header}
                  <SortIcon col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, ri) => (
                <tr key={ri} className="border-b border-border-subtle last:border-0">
                  {columns.map((_, ci) => (
                    <td key={ci} className="px-3 py-3.5 first:pl-0">
                      <div className="h-3 bg-secondary animate-pulse rounded" style={{ width: `${60 + (ci * 7) % 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <p className="text-title text-muted-foreground m-0">{emptyMessage}</p>
                  {emptySubMessage && <p className="text-small text-muted-foreground/70 mt-1.5 m-0">{emptySubMessage}</p>}
                </td>
              </tr>
            ) : (
              sorted.map((row, ri) => (
                <tr
                  key={keyField ? String(getValue(row, String(keyField))) : ri}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface/80 transition-colors duration-[120ms]"
                >
                  {columns.map(col => {
                    const cellVal = getValue(row, String(col.key));
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-3 py-3.5 text-foreground first:pl-0 last:pr-0 ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                        }`}
                      >
                        {col.render ? col.render(row) : String(cellVal ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? 'record' : 'records'}{search ? ` matching "${search}"` : ''}
        </p>
      )}
    </div>
  );
}

export { Table };
export default Table;
