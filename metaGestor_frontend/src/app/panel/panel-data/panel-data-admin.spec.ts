import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../../compartido/url-api';
import { CLAVE_SESION } from '../../pagina-Auth/servicios/sesion-service';
import { PanelData } from './panel-data';

describe('PanelData con rol ADMIN', () => {
  const urlApi = 'http://api.test/api';
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'jwt', rol: 'ADMIN', idUsuario: 1 }),
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

  it('resuelve participantes desde empleados sin llamar al endpoint restringido', () => {
    const data = TestBed.inject(PanelData);
    TestBed.tick();

    http.expectOne(`${urlApi}/clientes/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/empleados/buscar/all`).flush([
      {
        legajo: 1001,
        nombre: 'Luis Martínez',
        email: 'lmartinez@metagestor.cl',
        telefono: '911223344',
        dni: 16001122,
        historial: [],
      },
    ]);
    http.expectOne(`${urlApi}/tareas/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/solicitudes/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/registros/buscar/all`).flush([]);

    // El backend devuelve 403 en `registros/buscar/participantes` para ADMIN,
    // por eso ese endpoint no debe consultarse con este rol.
    http.expectNone(`${urlApi}/registros/buscar/participantes`);

    expect(data.nombreDeEmpleado(1001)).toBe('Luis Martínez');
    expect(data.nombreDeEmpleado(999)).toBe('Legajo #999');
  });
});
