import { TestBed } from '@angular/core/testing';
import { provideRouter, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { CLAVE_SESION, SesionService } from '../servicios/sesion-service';
import { soloAdminGuard } from './admin-guard';

const RUTA = {} as ActivatedRouteSnapshot;
const ESTADO = {} as RouterStateSnapshot;

describe('guarda de administración', () => {
  let sesion: SesionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    sesion = TestBed.inject(SesionService);
  });

  afterEach(() => {
    sessionStorage.removeItem(CLAVE_SESION);
  });

  function iniciarSesion(rol: string, idUsuario: number): void {
    sesion.guardarSesion({ token: 'jwt', rol, idUsuario });
  }

  it('allows an administrator to open the section', () => {
    iniciarSesion('ADMIN', 1);

    expect(TestBed.runInInjectionContext(() => soloAdminGuard(RUTA, ESTADO))).toBe(true);
  });

  it('redirects a manager to the panel start page', () => {
    iniciarSesion('GERENTE', 3);

    const resultado = TestBed.runInInjectionContext(() => soloAdminGuard(RUTA, ESTADO));

    expect(resultado.toString()).toBe('/panel/clientes');
  });

  it('redirects an employee to their own profile', () => {
    iniciarSesion('EMPLEADO', 2);

    const resultado = TestBed.runInInjectionContext(() => soloAdminGuard(RUTA, ESTADO));

    expect(resultado.toString()).toBe('/panel/empleados/2');
  });

  it('redirects a client to their own profile', () => {
    iniciarSesion('CLIENTE', 7);

    const resultado = TestBed.runInInjectionContext(() => soloAdminGuard(RUTA, ESTADO));

    expect(resultado.toString()).toBe('/panel/clientes/7');
  });
});
