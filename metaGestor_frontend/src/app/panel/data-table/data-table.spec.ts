import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DataTable, type TableColumn } from './data-table';

interface Person {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly status: 'active' | 'inactive';
}

const ROWS: readonly Person[] = [
  { id: 1, name: 'Ana Torres', city: 'Santiago', status: 'active' },
  { id: 2, name: 'Bruno Salas', city: 'Valparaíso', status: 'inactive' },
  { id: 3, name: 'Carla Rojas', city: 'Santiago', status: 'active' },
  { id: 4, name: 'Diego Fuentes', city: 'Concepción', status: 'active' },
  { id: 5, name: 'Elena Núñez', city: 'Valparaíso', status: 'inactive' },
];

const COLUMNS: readonly TableColumn<Person>[] = [
  { key: 'id', header: 'ID', value: (row) => String(row.id), kind: 'mono' },
  {
    key: 'name',
    header: 'Nombre',
    value: (row) => row.name,
    filter: 'text',
    filterPlaceholder: 'Nombre',
  },
  { key: 'city', header: 'Ciudad', value: (row) => row.city, filter: 'select' },
  {
    key: 'status',
    header: 'Estado',
    value: (row) => row.status,
    display: (row) => (row.status === 'active' ? 'Activo' : 'Inactivo'),
    kind: 'badge',
    tone: (row) => (row.status === 'active' ? 'success' : 'neutral'),
    filter: 'select',
    filterOptions: [
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' },
    ],
  },
];

type TableFixture = ComponentFixture<DataTable<Person>>;

async function createTable(pageSize = 10): Promise<TableFixture> {
  const fixture = TestBed.createComponent(DataTable<Person>);
  fixture.componentRef.setInput('columns', COLUMNS);
  fixture.componentRef.setInput('rows', ROWS);
  fixture.componentRef.setInput('rowId', (row: Person) => row.id);
  fixture.componentRef.setInput('caption', 'Personas');
  fixture.componentRef.setInput('pageSize', pageSize);

  // Act + Wait: deja que Angular renderice el estado inicial.
  await fixture.whenStable();
  return fixture;
}

function bodyRows(fixture: TableFixture): HTMLTableRowElement[] {
  const compiled = fixture.nativeElement as HTMLElement;
  return Array.from(compiled.querySelectorAll<HTMLTableRowElement>('tbody tr'));
}

async function typeInto(
  fixture: TableFixture,
  element: HTMLInputElement | HTMLSelectElement,
  value: string,
  event: 'input' | 'change',
): Promise<void> {
  element.value = value;
  element.dispatchEvent(new Event(event));
  await fixture.whenStable();
}

async function descargarCsv(accion: () => void): Promise<{ contenido: string; nombre: string }> {
  const crearOriginal = URL.createObjectURL;
  const revocarOriginal = URL.revokeObjectURL;
  const clickOriginal = HTMLAnchorElement.prototype.click;
  let blob: Blob | null = null;
  let nombre = '';

  URL.createObjectURL = (objeto: Blob | MediaSource) => {
    blob = objeto as Blob;
    return 'blob:prueba';
  };
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    nombre = this.download;
  };

  try {
    accion();
  } finally {
    URL.createObjectURL = crearOriginal;
    URL.revokeObjectURL = revocarOriginal;
    HTMLAnchorElement.prototype.click = clickOriginal;
  }

  const contenido = await new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsText(blob as Blob, 'UTF-8');
  });

  return { contenido, nombre };
}

describe('DataTable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTable],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the columns and every row', async () => {
    const fixture = await createTable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('thead th')).toHaveLength(4);
    expect(bodyRows(fixture)).toHaveLength(5);
    expect(compiled.textContent).toContain('Ana Torres');
    expect(compiled.querySelector('[aria-sort="none"]')).toBeTruthy();
  });

  it('searches across every column ignoring accents', async () => {
    const fixture = await createTable();
    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector('.search__input') as HTMLInputElement;

    await typeInto(fixture, search, 'valparaiso', 'input');

    const rows = bodyRows(fixture);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Bruno Salas'),
      expect.stringContaining('Elena Núñez'),
    ]);
  });

  it('combines per-column filters and shows the empty state', async () => {
    const fixture = await createTable();
    const compiled = fixture.nativeElement as HTMLElement;

    (compiled.querySelector('.table__actions .button') as HTMLButtonElement).click();
    await fixture.whenStable();

    const [nameFilter, cityFilter, statusFilter] = Array.from(
      compiled.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.filters__control'),
    );

    await typeInto(fixture, cityFilter, 'Santiago', 'change');
    expect(bodyRows(fixture)).toHaveLength(2);

    await typeInto(fixture, nameFilter, 'ana', 'input');
    expect(bodyRows(fixture)).toHaveLength(1);

    await typeInto(fixture, statusFilter, 'inactive', 'change');
    expect(compiled.querySelector('.table__empty')?.textContent).toContain('No se encontraron');
    expect(compiled.querySelector('.table__count')?.textContent).toContain('Sin resultados');
  });

  it('sorts a column in both directions', async () => {
    const fixture = await createTable();
    const compiled = fixture.nativeElement as HTMLElement;
    const idHeader = compiled.querySelector('.table__sort') as HTMLButtonElement;

    expect(bodyRows(fixture)[0].textContent).toContain('1');

    idHeader.click();
    await fixture.whenStable();
    expect(bodyRows(fixture)[0].textContent).toContain('1');
    expect(idHeader.closest('th')?.getAttribute('aria-sort')).toBe('ascending');

    idHeader.click();
    await fixture.whenStable();
    expect(bodyRows(fixture)[0].textContent).toContain('5');
    expect(idHeader.closest('th')?.getAttribute('aria-sort')).toBe('descending');
  });

  it('paginates the results and reports the visible range', async () => {
    const fixture = await createTable(2);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(bodyRows(fixture)).toHaveLength(2);
    expect(compiled.querySelector('.pager__status')?.textContent).toContain('Página 1 de 3');
    expect(compiled.querySelector('.table__count')?.textContent).toContain('Mostrando 1–2 de 5');

    (compiled.querySelector('button[aria-label="Página siguiente"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(bodyRows(fixture)[0].textContent).toContain('3');
    expect(compiled.querySelector('.table__count')?.textContent).toContain('Mostrando 3–4 de 5');
  });

  it('clears the search and filters with the reset button', async () => {
    const fixture = await createTable();
    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector('.search__input') as HTMLInputElement;

    await typeInto(fixture, search, 'santiago', 'input');
    expect(bodyRows(fixture)).toHaveLength(2);

    (compiled.querySelector('.button--ghost') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(bodyRows(fixture)).toHaveLength(5);
    expect(search.value).toBe('');
  });

  it('marks checkbox columns only when the row value is "true"', async () => {
    const columns: readonly TableColumn<Person>[] = [
      {
        key: 'active',
        header: 'Activo',
        value: (row) => String(row.status === 'active'),
        display: (row) => (row.status === 'active' ? 'Sí' : 'No'),
        kind: 'checkbox',
      },
    ];

    const fixture = TestBed.createComponent(DataTable<Person>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('rowId', (row: Person) => row.id);
    fixture.componentRef.setInput('caption', 'Personas');

    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const checkboxes = Array.from(
      compiled.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]'),
    );

    expect(checkboxes.map((checkbox) => checkbox.checked)).toEqual([
      true,
      false,
      true,
      true,
      false,
    ]);
  });

  it('hides only the delete action when the role cannot delete rows', async () => {
    const fixture = TestBed.createComponent(DataTable<Person>);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('rowId', (row: Person) => row.id);
    fixture.componentRef.setInput('caption', 'Personas');
    fixture.componentRef.setInput('mostrarAcciones', true);
    fixture.componentRef.setInput('puedeEliminar', false);

    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const acciones = Array.from(compiled.querySelectorAll('.table__acciones .table__accion')).map(
      (boton) => boton.textContent?.trim() ?? '',
    );

    expect(acciones).toHaveLength(ROWS.length);
    expect(acciones.every((texto) => texto === 'Modificar')).toBe(true);
  });

  it('renders link columns as navigation anchors', async () => {
    const columns: readonly TableColumn<Person>[] = [
      {
        key: 'name',
        header: 'Nombre',
        value: (row) => row.name,
        link: (row) => `/personas/${row.id}`,
      },
    ];

    const fixture = TestBed.createComponent(DataTable<Person>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('rowId', (row: Person) => row.id);
    fixture.componentRef.setInput('caption', 'Personas');

    // Act + Wait: deja que Angular renderice los enlaces de la columna.
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(
      compiled.querySelectorAll<HTMLAnchorElement>('tbody a.table__link'),
    );

    expect(links).toHaveLength(5);
    expect(links[0].getAttribute('href')).toBe('/personas/1');
    expect(links[0].textContent).toContain('Ana Torres');
    expect(compiled.querySelector('tbody .table__text')).toBeFalsy();
  });

  it('does not show the CSV button until export is enabled', async () => {
    const fixture = await createTable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.button--exportar')).toBeFalsy();

    fixture.componentRef.setInput('puedeExportar', true);
    await fixture.whenStable();

    expect(compiled.querySelector('.button--exportar')?.textContent).toContain('Exportar CSV');
  });

  it('exports the filtered rows with displayed values and escaped quotes', async () => {
    const fixture = await createTable();
    fixture.componentRef.setInput('rows', [
      { id: 1, name: 'Ana "La" Torres', city: 'Santiago', status: 'active' as const },
      ...ROWS.slice(1),
    ]);
    fixture.componentRef.setInput('puedeExportar', true);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector('.search__input') as HTMLInputElement;
    await typeInto(fixture, search, 'santiago', 'input');

    const descarga = await descargarCsv(() => {
      (compiled.querySelector('.button--exportar') as HTMLButtonElement).click();
    });

    expect(descarga.nombre).toMatch(/^Personas_\d{2}-\d{2}-\d{4}_\d{4}\.csv$/);
    expect(descarga.contenido).toContain('"ID";"Nombre";"Ciudad";"Estado"');
    expect(descarga.contenido).toContain('"1";"Ana ""La"" Torres";"Santiago";"Activo"');
    expect(descarga.contenido).toContain('"3";"Carla Rojas";"Santiago";"Activo"');
    expect(descarga.contenido).not.toContain('Bruno Salas');
  });

  it('keeps export-disabled columns in the table but out of the CSV', async () => {
    const columnas: readonly TableColumn<Person>[] = [
      { key: 'name', header: 'Nombre', value: (row) => row.name },
      {
        key: 'perfil',
        header: 'Perfil',
        exportar: false,
        value: () => 'Ver perfil',
        link: (row) => `/personas/${row.id}`,
        sortable: false,
      },
    ];

    const fixture = TestBed.createComponent(DataTable<Person>);
    fixture.componentRef.setInput('columns', columnas);
    fixture.componentRef.setInput('rows', ROWS.slice(0, 1));
    fixture.componentRef.setInput('rowId', (row: Person) => row.id);
    fixture.componentRef.setInput('caption', 'Personas');
    fixture.componentRef.setInput('puedeExportar', true);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('thead th')).toHaveLength(2);
    expect(compiled.textContent).toContain('Ver perfil');

    const descarga = await descargarCsv(() => {
      (compiled.querySelector('.button--exportar') as HTMLButtonElement).click();
    });

    expect(descarga.contenido).toContain('"Nombre"');
    expect(descarga.contenido).not.toContain('Perfil');
    expect(descarga.contenido).not.toContain('Ver perfil');
  });
});
