import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
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

describe('DataTable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DataTable] }).compileComponents();
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
});
