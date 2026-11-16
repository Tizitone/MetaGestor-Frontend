import { TestBed } from '@angular/core/testing';
import {
  convertToParamMap,
  provideRouter,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { CLAVE_SESION, SesionService } from '../servicios/sesion-service';
import { perfilGerenteGuard } from './gerente-guard';

function rutaConLegajo(legajo: string): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap({ legajo }) } as ActivatedRouteSnapshot;
}

const ESTADO = {} as RouterStateSnapshot;

describe('guarda de perfil de gerente', () => {
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

  function iniciarSesion(rol: string, idUsuario: number | null): void {
    sesion.guardarSesion({ token: 'jwt', rol, idUsuario: idUsuario ?? 0 });
  }

  it('allows an administrator to open any manager profile', () => {
    iniciarSesion('ADMIN', 1);

    expect(
      TestBed.runInInjectionContext(() => perfilGerenteGuard(rutaConLegajo('3'), ESTADO)),
    ).toBe(true);
  });

  it('lets a manager open only their own profile', () => {
    iniciarSesion('GERENTE', 3);

    const propio = TestBed.runInInjectionContext(() =>
      perfilGerenteGuard(rutaConLegajo('3'), ESTADO),
    );
    const ajeno = TestBed.runInInjectionContext(() =>
      perfilGerenteGuard(rutaConLegajo('4'), ESTADO),
    );

    expect(propio).toBe(true);
    expect(ajeno.toString()).toBe('/panel/gerentes/3');
  });

  it('redirects an employee to their own profile', () => {
    iniciarSesion('EMPLEADO', 2);

    const resultado = TestBed.runInInjectionContext(() =>
      perfilGerenteGuard(rutaConLegajo('3'), ESTADO),
    );

    expect(resultado.toString()).toBe('/panel/empleados/2');
  });

  it('redirects a client to their own profile', () => {
    iniciarSesion('CLIENTE', 7);

    const resultado = TestBed.runInInjectionContext(() =>
      perfilGerenteGuard(rutaConLegajo('3'), ESTADO),
    );

    expect(resultado.toString()).toBe('/panel/clientes/7');
  });
});
