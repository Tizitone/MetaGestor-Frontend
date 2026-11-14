import { inject } from '@angular/core';
import { Router, type UrlTree } from '@angular/router';
import { rutaInicioPorRol } from '../servicios/ruta-por-rol';
import { SesionService } from '../servicios/sesion-service';

/**
 * Redirección de `/panel` a la pantalla principal de cada rol.
 *
 * Angular ejecuta las funciones de `redirectTo` dentro de un contexto de
 * inyección, por eso aquí se puede usar `inject`.
 */
export function redireccionInicioPanel(): UrlTree {
  const sesion = inject(SesionService);

  return inject(Router).createUrlTree(rutaInicioPorRol(sesion.rol(), sesion.idUsuario()));
}
