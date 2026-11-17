import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { rutaInicioPorRol } from '../servicios/ruta-por-rol';
import { SesionService } from '../servicios/sesion-service';

/**
 * Un gerente solo puede abrir su propio perfil; el administrador puede abrir
 * cualquiera. Los demás roles vuelven a su pantalla de inicio.
 */
export const perfilGerenteGuard: CanActivateFn = (route) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const rol = (sesion.rol() ?? '').toUpperCase();
  const idUsuario = sesion.idUsuario();

  if (rol.includes('ADMIN')) {
    return true;
  }

  if (rol.includes('GERENTE')) {
    const legajo = route.paramMap.get('legajo');

    return idUsuario !== null && String(idUsuario) === legajo
      ? true
      : router.createUrlTree(
          idUsuario ? ['/panel/gerentes', String(idUsuario)] : ['/panel/clientes'],
        );
  }

  return router.createUrlTree(rutaInicioPorRol(rol, idUsuario));
};
