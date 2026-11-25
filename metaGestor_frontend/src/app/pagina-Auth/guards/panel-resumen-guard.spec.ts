import { TestBed } from '@angular/core/testing';
import { provideRouter, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { CLAVE_SESION, SesionService } from '../servicios/sesion-service';
import { soloAdminOGerenteGuard } from './panel-resumen-guard';

const RUTA = {} as ActivatedRouteSnapshot;
const ESTADO = {} as RouterStateSnapshot;

describe('guarda del resumen del panel', () => {
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

  function activar(): string {
    const resultado = TestBed.runInInjectionContext(() =>
      soloAdminOGerenteGuard(RUTA, ESTADO),
    );

    return resultado.toString();
  }

  it('allows an administrator to open the summary', () => {
    iniciarSesion('ADMIN', 1);

    expect(TestBed.runInInjectionContext(() => soloAdminOGerenteGuard(RUTA, ESTADO))).toBe(true);
  });

  it('allows a manager to open the summary', () => {
    iniciarSesion('GERENTE', 3);

    expect(TestBed.runInInjectionContext(() => soloAdminOGerenteGuard(RUTA, ESTADO))).toBe(true);
  });

  it('redirects an employee to their own profile', () => {
    iniciarSesion('EMPLEADO', 2);

    expect(activar()).toBe('/panel/empleados/2');
  });

  it('redirects a client to their own profile', () => {
    iniciarSesion('CLIENTE', 7);

    expect(activar()).toBe('/panel/clientes/7');
  });
});
