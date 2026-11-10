import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SesionService } from './sesion-service';

/**
 * Adjunta el JWT de la sesion a cada peticion dirigida al backend.
 *
 * El login queda sin cabecera porque todavia no existe token. Si una peticion
 * ya trae `Authorization`, se respeta tal cual.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const token = inject(SesionService).token();

  if (!token || peticion.headers.has('Authorization')) {
    return siguiente(peticion);
  }

  return siguiente(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
