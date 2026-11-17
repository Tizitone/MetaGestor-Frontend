import { TestBed } from '@angular/core/testing';
import {
  convertToParamMap,
  provideRouter,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { CLAVE_SESION, SesionService } from '../servicios/sesion-service';
import { perfilEmpleadoGuard, sinAbmEmpleadoGuard } from './empleado-guard';

function rutaConLegajo(legajo: string): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap({ legajo }) } as ActivatedRouteSnapshot;
}

const ESTADO = {} as RouterStateSnapshot;

describe('guardas de empleado', () => {
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

  it('allows management roles into the general ABM sections', () => {
    iniciarSesion('ADMIN', 1);

    expect(
      TestBed.runInInjectionContext(() => sinAbmEmpleadoGuard(rutaConLegajo('1'), ESTADO)),
    ).toBe(true);
  });

  it('redirects an employee away from the general ABM sections', () => {
    iniciarSesion('EMPLEADO', 3);

    const resultado = TestBed.runInInjectionContext(() =>
      sinAbmEmpleadoGuard(rutaConLegajo('1'), ESTADO),
    );

    expect(resultado.toString()).toBe('/panel/empleados/3');
  });

  it('lets an employee open only their own profile', () => {
    iniciarSesion('EMPLEADO', 3);

    const propio = TestBed.runInInjectionContext(() =>
      perfilEmpleadoGuard(rutaConLegajo('3'), ESTADO),
    );
    const ajeno = TestBed.runInInjectionContext(() =>
      perfilEmpleadoGuard(rutaConLegajo('4'), ESTADO),
    );

    expect(propio).toBe(true);
    expect(ajeno.toString()).toBe('/panel/empleados/3');
  });
});
