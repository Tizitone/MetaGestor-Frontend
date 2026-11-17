import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { rutaInicioPorRol } from '../servicios/ruta-por-rol';
import { SesionService } from '../servicios/sesion-service';

/**
 * Restringe una ruta al rol ADMIN. Los demás roles vuelven a su pantalla de
 * inicio para que no puedan abrir secciones de administración por URL directa.
 */
export const soloAdminGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const rol = (sesion.rol() ?? '').toUpperCase();

  if (rol.includes('ADMIN')) {
    return true;
  }

  return inject(Router).createUrlTree(rutaInicioPorRol(rol, sesion.idUsuario()));
};
