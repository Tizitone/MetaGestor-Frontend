import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URL_API } from '../../compartido/url-api';
import type { CredencialesInicioSesion, NuevoCliente } from '../modelos/credenciales';
import { AutenticacionService } from './autenticacion-service';

describe('AutenticacionService', () => {
  let servicio: AutenticacionService;
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
    servicio = TestBed.inject(AutenticacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(servicio).toBeTruthy();
  });

  it('should send the login credentials to the backend', () => {
    const credenciales: CredencialesInicioSesion = {
      email: 'cliente@metagestor.cl',
      contrasenia: 'Clave1234',
    };

    servicio.iniciarSesion(credenciales).subscribe();

    const peticion = http.expectOne(`${urlApi}/auth/login`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(credenciales);

    peticion.flush({ token: 'jwt', rol: 'CLIENTE', idUsuario: 7 });
  });

  it('should send the client data to the registration endpoint', () => {
    const cliente: NuevoCliente = {
      nombre: 'Ana Perez',
      email: 'ana@metagestor.cl',
      telefono: '1123456789',
      dni: 12345678,
      contrasenia: 'Clave1234',
    };

    servicio.registrarCliente(cliente).subscribe();

    const peticion = http.expectOne(`${urlApi}/clientes`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual(cliente);

    peticion.flush(cliente);
  });
});
