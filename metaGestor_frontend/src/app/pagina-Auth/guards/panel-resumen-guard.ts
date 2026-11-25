import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { rutaInicioPorRol } from '../servicios/ruta-por-rol';
import { SesionService } from '../servicios/sesion-service';

/** Permite abrir el resumen solo a ADMIN y GERENTE; los demás roles vuelven a su inicio. */
export const soloAdminOGerenteGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const rol = (sesion.rol() ?? '').toUpperCase();

  if (rol.includes('ADMIN') || rol.includes('GERENTE')) {
    return true;
  }

  return inject(Router).createUrlTree(rutaInicioPorRol(rol, sesion.idUsuario()));
};
