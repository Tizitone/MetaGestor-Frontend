import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Modal } from '../modal/modal';

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
  /**
   * Cuando se define, la celda de texto se renderiza como un enlace de
   * navegación en lugar de un texto plano.
   */
  readonly link?: (row: T) => string;
  readonly kind?: 'text' | 'badge' | 'mono' | 'checkbox';
  readonly tone?: (row: T) => BadgeTone;
  readonly filter?: 'text' | 'select';
  readonly filterOptions?: readonly FilterOption[];
  readonly filterPlaceholder?: string;
  readonly sortable?: boolean;
  readonly align?: 'start' | 'end';
  readonly width?: string;
  /** Permite excluir la columna del CSV sin ocultarla de la tabla. */
  readonly exportar?: boolean;
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
  imports: [RouterLink, Modal],
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
  /** Agrega la columna de acciones (modificar / eliminar) al final de cada fila. */
  readonly mostrarAcciones = input(false);
  /** Permite ocultar solo el botón «Eliminar» cuando el rol no puede borrar. */
  readonly puedeEliminar = input(true);
  /** Muestra el botón para descargar las filas filtradas como CSV. */
  readonly puedeExportar = input(false);
  /** Agrega el botón «Ver detalle» en la columna de acciones. */
  readonly mostrarDetalle = input(false);
  /** Se emite con la fila al pulsar el botón «Ver detalle». */
  readonly filaDetalle = output<T>();
  /** Se emite con la fila al pulsar el botón «Modificar». */
  readonly filaModificada = output<T>();
  /** Se emite con la fila después de confirmar la eliminación. */
  readonly filaEliminada = output<T>();

  protected readonly filterPanelId = `table-filters-${nextFilterPanelId++}`;
  protected readonly search = signal('');
  protected readonly columnFilters = signal<Readonly<Record<string, string>>>({});
  protected readonly showFilters = signal(false);
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  private readonly pageIndex = signal(0);
  /** Fila pendiente de confirmación; se emite solo al aceptar la baja. */
  protected readonly filaPorEliminar = signal<T | null>(null);
  /** Identificador de esa fila, tomado del texto de la primera columna. */
  protected readonly etiquetaFilaPorEliminar = computed(() => {
    const fila = this.filaPorEliminar();
    const columna = this.columns()[0];
    return fila === null || columna === undefined ? '' : this.cellText(columna, fila);
  });

  protected readonly hasColumnFilters = computed(() =>
    this.columns().some((column) => column.filter !== undefined),
  );

  /** Columnas visibles, incluida la de acciones cuando está activada. */
  protected readonly totalColumnas = computed(() =>
    this.columns().length + (this.mostrarAcciones() || this.mostrarDetalle() ? 1 : 0),
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

  private valorCsv(valor: string): string {
    return `"${valor.replaceAll('"', '""')}"`;
  }

  private nombreArchivo(): string {
    const ahora = new Date();
    const nombre =
      (this.caption() || 'listado')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'listado';
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minuto = String(ahora.getMinutes()).padStart(2, '0');

    return `${nombre}_${dia}-${mes}-${ahora.getFullYear()}_${hora}${minuto}.csv`;
  }

  /** Descarga las filas filtradas y ordenadas con el texto que muestra la tabla. */
  protected exportarCsv(): void {
    const columnas = this.columns().filter((columna) => columna.exportar !== false);
    const lineas = [
      columnas.map((columna) => this.valorCsv(columna.header)).join(';'),
      ...this.filteredRows().map((fila) =>
        columnas.map((columna) => this.valorCsv(this.cellText(columna, fila))).join(';'),
      ),
    ];

    const blob = new Blob(['\uFEFF', lineas.join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = this.nombreArchivo();
    enlace.click();
    URL.revokeObjectURL(url);
  }

  /** Las columnas `checkbox` se marcan cuando el valor de la fila es `'true'`. */
  protected isChecked(column: TableColumn<T>, row: T): boolean {
    return column.value(row) === 'true';
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

  protected pedirEliminacion(row: T): void {
    this.filaPorEliminar.set(row);
  }

  protected cancelarEliminacion(): void {
    this.filaPorEliminar.set(null);
  }

  protected confirmarEliminacion(): void {
    const fila = this.filaPorEliminar();
    if (fila === null) {
      return;
    }

    this.filaEliminada.emit(fila);
    this.filaPorEliminar.set(null);
  }
}
