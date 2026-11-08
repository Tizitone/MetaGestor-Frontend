import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion-service';

/** Bloquea el panel cuando no hay una sesion iniciada. */
export const authGuard: CanActivateFn = () =>
  inject(SesionService).token() ? true : inject(Router).createUrlTree(['/login']);
