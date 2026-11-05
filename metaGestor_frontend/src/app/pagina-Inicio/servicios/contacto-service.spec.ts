import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../../compartido/url-api';
import type { SolicitudContacto } from '../modelos/solicitud-contacto';
import { ContactoService } from './contacto-service';

describe('ContactoService', () => {
  let servicio: ContactoService;
  let http: HttpTestingController;

  const urlApi = 'http://localhost:8080/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ...provideHttpClientTesting(),
        { provide: URL_API, useValue: urlApi },
      ],
    });
    servicio = TestBed.inject(ContactoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(servicio).toBeTruthy();
  });

  it('should send the request with POST, the configured URL and the backend field names', () => {
    const solicitud: SolicitudContacto = {
      nombre: 'Ana Perez',
      email: 'ana@metagestor.cl',
      telefono: '+56 9 1234 5678',
      descripcion: 'Necesito una cotizacion de estructuras metalicas.',
    };

    servicio.enviarSolicitud(solicitud).subscribe();

    const peticion = http.expectOne(`${urlApi}/solicitudes/crear`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(solicitud);
    expect(Object.keys(peticion.request.body)).toEqual([
      'nombre',
      'email',
      'telefono',
      'descripcion',
    ]);

    peticion.flush({ id: 1, ...solicitud });
  });
});
