import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../../compartido/url-api';
import { CLAVE_SESION } from '../../pagina-Auth/servicios/sesion-service';
import { PanelData } from './panel-data';

describe('PanelData con rol CLIENTE', () => {
  const urlApi = 'http://api.test/api';
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'jwt', rol: 'CLIENTE', idUsuario: 7 }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ...provideHttpClientTesting(),
        { provide: URL_API, useValue: urlApi },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    sessionStorage.removeItem(CLAVE_SESION);
    http.verify();
  });

  it('solo consulta los endpoints habilitados para un cliente', () => {
    TestBed.inject(PanelData);
    TestBed.tick();

    http.expectOne(`${urlApi}/clientes/7`).flush({
      idCliente: 7,
      nombre: 'Ana Torres',
      email: 'ana.torres@andesminerals.cl',
      telefono: '912345678',
      dni: 18345678,
    });

    http.expectOne(`${urlApi}/registros/buscar/participantes`).flush([]);

    http.expectOne(`${urlApi}/registros/buscar/cliente/7`).flush([
      {
        id: 1,
        titulo: 'Barandas escalera bloque A',
        tareaId: 1,
        clienteId: 7,
        proceso: 'TERMINADO',
        participantesId: [],
        publicado: true,
      },
    ]);

    // La tarea por registro se consulta en un efecto posterior.
    TestBed.tick();
    http
      .match((peticion) => peticion.url === `${urlApi}/registros/buscar/tareas/1`)
      .forEach((peticion) => peticion.flush([]));

    // Ninguna colección reservada a otros roles debe haberse solicitado.
    for (const prohibida of [
      '/clientes/buscar/all',
      '/empleados/buscar/all',
      '/gerentes/buscar/all',
      '/tareas/buscar/all',
      '/empleados/historial',
      '/solicitudes/buscar/all',
      '/registros/buscar/all',
    ]) {
      http.expectNone(`${urlApi}${prohibida}`);
    }
  });
});
