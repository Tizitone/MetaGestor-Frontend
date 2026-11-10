import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../../compartido/url-api';
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

  function responderColecciones(): void {
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
            titulo: 'Barandas escalera',
            fecha_de_entrega: '2026-11-10',
            fechaDeRegistro: '2026-10-21T09:15:12',
            descripcion_material: 'Perfiles de acero',
            descripcion_general: 'Fabricación de barandas',
            cantidad: 4,
          },
        ],
      },
    ]);

    http.expectOne(`${urlApi}/tareas/buscar/all`).flush([
      {
        idTarea: 1,
        categorias: 'LIGERO',
        titulo: 'Barandas escalera',
        fechaDeEntrega: '2026-11-10',
        fechaDeRegistro: '2026-10-21T09:15:12',
        descripcionMaterial: 'Perfiles de acero al carbono',
        descripcionGeneral: 'Fabricación de barandas para escalera',
        cantidad: 4,
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

  /**
   * PanelData también lanza al instante las consultas por cliente y el
   * historial del empleado autenticado. Se responden vacías para que
   * `http.verify()` no encuentre peticiones abiertas; a diferencia de las
   * colecciones, estas no se repiten cuando hay una recarga.
   *
   * Nota: la URL de registros por cliente se construye interpolando la señal
   * `idActual` (preexistente), por lo que se casa por prefijo.
   */
  function responderPeticionesAuxiliares(): void {
    http
      .match((peticion) => peticion.url.startsWith(`${urlApi}/registros/buscar/cliente/`))
      .forEach((peticion) => peticion.flush([]));
    http
      .match((peticion) => peticion.url === `${urlApi}/empleados/historial`)
      .forEach((peticion) => peticion.flush([]));
  }

  function responderTodo(): void {
    responderColecciones();
    responderPeticionesAuxiliares();
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
    expect(data.resumenDeTarea(1)).toBe('Barandas escalera');
    expect(data.nombreDeEmpleado(1001)).toBe('Luis Martínez');
  });

  it('normalizes the JPA task shape returned inside the employee history', () => {
    responderTodo();

    expect(data.empleados()[0].historial[0]).toEqual({
      idTarea: 1,
      categorias: 'PESADO',
      titulo: 'Barandas escalera',
      fechaDeEntrega: '2026-11-10',
      fechaDeRegistro: '2026-10-21T09:15:12',
      descripcionMaterial: 'Perfiles de acero',
      descripcionGeneral: 'Fabricación de barandas',
      cantidad: 4,
    });
  });

  it('falls back to a readable label for unknown IDs', () => {
    responderTodo();

    expect(data.nombreDeCliente(999)).toBe('Cliente #999');
    expect(data.resumenDeTarea(999)).toBe('Tarea #999');
    expect(data.nombreDeEmpleado(999)).toBe('Legajo #999');
  });

  it('creates a client and reloads the collections', async () => {
    responderTodo();

    const operacion = data.crearCliente({
      email: 'nuevo@correo.cl',
      contrasenia: 'clave1234',
      nombre: 'Nuevo Cliente',
      telefono: '912345678',
      dni: 20111222,
    });

    const peticion = http.expectOne({ method: 'POST', url: `${urlApi}/clientes` });
    expect(peticion.request.body).toEqual({
      email: 'nuevo@correo.cl',
      contrasenia: 'clave1234',
      nombre: 'Nuevo Cliente',
      telefono: '912345678',
      dni: 20111222,
    });
    peticion.flush({});

    await operacion;

    // La operación exitosa vuelve a pedir las cinco colecciones.
    responderTodo();
  });

  it('updates a record with its id in the path and reloads', async () => {
    responderTodo();

    const operacion = data.modificarRegistro(3, {
      titulo: 'Pasarela nave 2',
      tareaId: 3,
      clienteId: 2,
      proceso: 'TERMINADO',
      participantesId: [1001],
      publicado: false,
    });

    const peticion = http.expectOne({ method: 'PUT', url: `${urlApi}/registros/3` });
    expect(peticion.request.body).toEqual({
      titulo: 'Pasarela nave 2',
      tareaId: 3,
      clienteId: 2,
      proceso: 'TERMINADO',
      participantesId: [1001],
      publicado: false,
    });
    peticion.flush({});

    await operacion;
    responderTodo();
  });

  it('deletes a task and reloads the collections', async () => {
    responderTodo();

    const operacion = data.eliminarTarea(9);

    http.expectOne({ method: 'DELETE', url: `${urlApi}/tareas/9` }).flush(null, {
      status: 200,
      statusText: 'OK',
    });

    await operacion;
    responderTodo();
  });

  it('does not reload the collections when the request fails', async () => {
    responderTodo();

    const operacion = data.eliminarSolicitud(4);

    const peticion = http.expectOne({ method: 'DELETE', url: `${urlApi}/solicitudes/borrar/4` });
    peticion.flush('Solicitud no encontrada', {
      status: 404,
      statusText: 'Not Found',
    });

    let fallo: unknown = null;

    try {
      await operacion;
    } catch (error: unknown) {
      fallo = error;
    }

    expect(fallo).toBeTruthy();
    http.verify();
  });
});
