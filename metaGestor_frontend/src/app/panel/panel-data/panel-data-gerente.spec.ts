import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../../compartido/url-api';
import { CLAVE_SESION } from '../../pagina-Auth/servicios/sesion-service';
import { PanelData } from './panel-data';

describe('PanelData con rol GERENTE', () => {
  const urlApi = 'http://api.test/api';
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'jwt', rol: 'GERENTE', idUsuario: 3 }),
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

  it('permite exportar los listados del panel', () => {
    const data = TestBed.inject(PanelData);
    TestBed.tick();

    http.expectOne(`${urlApi}/clientes/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/empleados/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/tareas/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/solicitudes/buscar/all`).flush([]);
    http.expectOne(`${urlApi}/registros/buscar/all`).flush([]);

    expect(data.esGerente).toBe(true);
    expect(data.puedeExportar).toBe(true);
  });
});
