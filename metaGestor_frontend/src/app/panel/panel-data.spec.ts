import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../compartido/url-api';
import { PanelData } from './panel-data';

describe('PanelData', () => {
  const urlApi = 'http://api.test/api';
  let data: PanelData;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ...provideHttpClientTesting(),
        { provide: URL_API, useValue: urlApi },
      ],
    });

    data = TestBed.inject(PanelData);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function responderTodo(): void {
    http.expectOne(`${urlApi}/clientes/buscar/all`).flush([
      {
        idCliente: 1,
        nombre: 'Ana Torres',
        email: 'ana.torres@andesminerals.cl',
        telefono: '912345678',
        dni: 18345678,
      },
    ]);

    http.expectOne(`${urlApi}/empleados/buscar/all`).flush([
      {
        legajo: 1001,
        nombre: 'Luis Martínez',
        email: 'lmartinez@metagestor.cl',
        telefono: '911223344',
        dni: 16001122,
        // El backend real devuelve el historial como entidad JPA.
        historial: [
          {
            id: 1,
            categorias: 'PESADO',
            fecha_de_entrega: '2026-11-10',
            fechaDeRegistro: '2026-10-21T09:15:12',
            descripcion_material: 'Perfiles de acero',
            descripcion_general: 'Fabricación de barandas',
          },
        ],
      },
    ]);

    http.expectOne(`${urlApi}/tareas/buscar/all`).flush([
      {
        idTarea: 1,
        categorias: 'LIGERO',
        fechaDeEntrega: '2026-11-10',
        fechaDeRegistro: '2026-10-21T09:15:12',
        descripcionMaterial: 'Perfiles de acero al carbono',
        descripcionGeneral: 'Fabricación de barandas para escalera',
      },
    ]);

    http.expectOne(`${urlApi}/solicitudes/buscar/all`).flush([
      {
        id: 1,
        nombre: 'María López',
        email: 'maria.lopez@correo.cl',
        telefono: '911234567',
        descripcion: 'Cotización de rejas de protección.',
      },
    ]);

    http.expectOne(`${urlApi}/registros/buscar/all`).flush([
      {
        id: 1,
        titulo: 'Barandas escalera bloque A',
        tareaId: 1,
        clienteId: 1,
        proceso: 'TERMINADO',
        participantesId: [1001],
        publicado: true,
      },
    ]);
  }

  it('loads the five collections from the backend', () => {
    responderTodo();

    expect(data.clientes()).toHaveLength(1);
    expect(data.empleados()).toHaveLength(1);
    expect(data.tareas()).toHaveLength(1);
    expect(data.solicitudes()).toHaveLength(1);
    expect(data.registros()).toHaveLength(1);
  });

  it('resolves the IDs used by the registros table', () => {
    responderTodo();

    expect(data.nombreDeCliente(1)).toBe('Ana Torres');
    expect(data.resumenDeTarea(1)).toBe('Fabricación de barandas para escalera');
    expect(data.nombreDeEmpleado(1001)).toBe('Luis Martínez');
  });

  it('normalizes the JPA task shape returned inside the employee history', () => {
    responderTodo();

    expect(data.empleados()[0].historial[0]).toEqual({
      idTarea: 1,
      categorias: 'PESADO',
      fechaDeEntrega: '2026-11-10',
      fechaDeRegistro: '2026-10-21T09:15:12',
      descripcionMaterial: 'Perfiles de acero',
      descripcionGeneral: 'Fabricación de barandas',
    });
  });

  it('falls back to a readable label for unknown IDs', () => {
    responderTodo();

    expect(data.nombreDeCliente(999)).toBe('Cliente #999');
    expect(data.resumenDeTarea(999)).toBe('Tarea #999');
    expect(data.nombreDeEmpleado(999)).toBe('Legajo #999');
  });
});
