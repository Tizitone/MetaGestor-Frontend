import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

export interface TableColumn<T> {
  /** Identificador único de la columna. */
  readonly key: string;
  readonly header: string;
  /** Valor usado para buscar, filtrar y ordenar. */
  readonly value: (row: T) => string;
  /** Texto visible; si no se indica se usa `value`. */
  readonly display?: (row: T) => string;
  readonly kind?: 'text' | 'badge' | 'mono';
  readonly tone?: (row: T) => BadgeTone;
  readonly filter?: 'text' | 'select';
  readonly filterOptions?: readonly FilterOption[];
  readonly filterPlaceholder?: string;
  readonly sortable?: boolean;
  readonly align?: 'start' | 'end';
  readonly width?: string;
}

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

let nextFilterPanelId = 0;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly rowId = input.required<(row: T) => string | number>();
  readonly caption = input('');
  readonly searchPlaceholder = input('Buscar en los registros…');
  readonly emptyMessage = input('No se encontraron registros con los filtros aplicados.');
  readonly pageSize = input(10);

  protected readonly filterPanelId = `table-filters-${nextFilterPanelId++}`;
  protected readonly search = signal('');
  protected readonly columnFilters = signal<Readonly<Record<string, string>>>({});
  protected readonly showFilters = signal(false);
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  private readonly pageIndex = signal(0);

  protected readonly hasColumnFilters = computed(() =>
    this.columns().some((column) => column.filter !== undefined),
  );

  protected readonly hasActiveFilters = computed(() => {
    const hasSearch = normalize(this.search()).length > 0;
    const hasColumnFilter = Object.values(this.columnFilters()).some(
      (value) => value.trim().length > 0,
    );
    return hasSearch || hasColumnFilter;
  });

  private readonly optionsByColumn = computed(() => {
    const options = new Map<string, readonly FilterOption[]>();

    for (const column of this.columns()) {
      if (column.filter !== 'select') {
        continue;
      }

      if (column.filterOptions) {
        options.set(column.key, column.filterOptions);
        continue;
      }

      const unique = new Map<string, string>();
      for (const row of this.rows()) {
        const value = column.value(row);
        if (value && !unique.has(value)) {
          unique.set(value, column.display?.(row) ?? value);
        }
      }

      options.set(
        column.key,
        [...unique.entries()]
          .map(([value, label]) => ({ value, label }))
          .sort((a, b) => collator.compare(a.label, b.label)),
      );
    }

    return options;
  });

  private readonly filteredRows = computed(() => {
    const columns = this.columns();
    const term = normalize(this.search());
    const filters = this.columnFilters();
    const sortKey = this.sortKey();

    let result = this.rows().filter((row) => {
      if (!term) {
        return true;
      }

      return columns.some((column) =>
        normalize(`${column.value(row)} ${column.display?.(row) ?? ''}`).includes(term),
      );
    });

    for (const column of columns) {
      const rawFilter = filters[column.key]?.trim();
      if (!rawFilter) {
        continue;
      }

      const wanted = normalize(rawFilter);
      result = result.filter((row) => {
        const value = normalize(column.value(row));
        return column.filter === 'select' ? value === wanted : value.includes(wanted);
      });
    }

    const sortColumn = sortKey ? columns.find((column) => column.key === sortKey) : undefined;
    if (sortColumn) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      result = result.sort(
        (a, b) => collator.compare(sortColumn.value(a), sortColumn.value(b)) * direction,
      );
    }

    return result;
  });

  protected readonly total = computed(() => this.filteredRows().length);

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );

  protected readonly currentPage = computed(() => Math.min(this.pageIndex(), this.pageCount() - 1));

  protected readonly pageRows = computed(() => {
    const size = Math.max(1, this.pageSize());
    const start = this.currentPage() * size;
    return this.filteredRows().slice(start, start + size);
  });

  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : this.currentPage() * Math.max(1, this.pageSize()) + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.total(), (this.currentPage() + 1) * Math.max(1, this.pageSize())),
  );

  protected trackRow = (row: T): string | number => this.rowId()(row);

  protected cellText(column: TableColumn<T>, row: T): string {
    return column.display?.(row) ?? column.value(row);
  }

  protected toneFor(column: TableColumn<T>, row: T): BadgeTone {
    return column.tone?.(row) ?? 'neutral';
  }

  protected filterValue(key: string): string {
    return this.columnFilters()[key] ?? '';
  }

  protected optionsFor(key: string): readonly FilterOption[] {
    return this.optionsByColumn().get(key) ?? [];
  }

  protected ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== column.key) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(column: TableColumn<T>): string {
    if (this.sortKey() !== column.key) {
      return '↕';
    }

    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  protected onColumnFilter(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.columnFilters.update((current) => ({ ...current, [key]: value }));
    this.pageIndex.set(0);
  }

  protected toggleFilters(): void {
    this.showFilters.update((visible) => !visible);
  }

  protected resetFilters(): void {
    this.search.set('');
    this.columnFilters.set({});
    this.pageIndex.set(0);
  }

  protected toggleSort(column: TableColumn<T>): void {
    if (column.sortable === false) {
      return;
    }

    if (this.sortKey() === column.key) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(column.key);
      this.sortDirection.set('asc');
    }

    this.pageIndex.set(0);
  }

  protected goToPage(index: number): void {
    this.pageIndex.set(Math.min(Math.max(index, 0), this.pageCount() - 1));
  }
}
