import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { SesionService } from '../servicios/sesion-service';

/** `true` cuando la sesión actual pertenece al rol EMPLEADO. */
function esEmpleado(): boolean {
  return (inject(SesionService).rol() ?? '').toUpperCase().includes('EMPLEADO');
}

/** Inicio del empleado: su perfil o, si falta el id, la lista de tareas. */
function inicioEmpleado(): UrlTree {
  const sesion = inject(SesionService);
  const idUsuario = sesion.idUsuario();

  return inject(Router).createUrlTree(
    idUsuario ? ['/panel/empleados', idUsuario] : ['/panel/tareas'],
  );
}

/**
 * El empleado no debe usar las pantallas con ABM general (clientes, empleados,
 * solicitudes y registros). Se le devuelve a su perfil, que es donde puede
 * modificar el estado de sus registros.
 */
export const sinAbmEmpleadoGuard: CanActivateFn = () =>
  esEmpleado() ? inicioEmpleado() : true;

/** Un empleado solo puede abrir su propio perfil. */
export const perfilEmpleadoGuard: CanActivateFn = (route) => {
  if (!esEmpleado()) {
    return true;
  }

  const idUsuario = inject(SesionService).idUsuario();
  const legajo = route.paramMap.get('legajo');

  return idUsuario !== null && String(idUsuario) === legajo ? true : inicioEmpleado();
};
