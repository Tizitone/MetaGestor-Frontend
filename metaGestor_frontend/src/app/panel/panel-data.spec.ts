import { TestBed } from '@angular/core/testing';
import { PanelData } from './panel-data';

describe('PanelData', () => {
  let data: PanelData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    data = TestBed.inject(PanelData);
  });

  it('resolves the IDs used by the registros table', () => {
    expect(data.nombreDeCliente(1)).toBe('Ana Torres');
    expect(data.resumenDeTarea(1)).toBe('Fabricación de barandas para escalera');
    expect(data.nombreDeEmpleado(1001)).toBe('Luis Martínez');
  });

  it('falls back to a readable label for unknown IDs', () => {
    expect(data.nombreDeCliente(999)).toBe('Cliente #999');
    expect(data.resumenDeTarea(999)).toBe('Tarea #999');
    expect(data.nombreDeEmpleado(999)).toBe('Legajo #999');
  });
});
