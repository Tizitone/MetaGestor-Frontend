import { InjectionToken, isDevMode } from '@angular/core';

/**
 * URL base de la API.
 *
 * En produccion apunta a Railway; en desarrollo usa `/api`, que el proxy de
 * `ng serve` reenvia al backend para evitar el bloqueo de CORS.
 */
export const URL_API = new InjectionToken<string>('URL_API', {
  providedIn: 'root',
  factory: () =>
    isDevMode() ? '/api' : 'https://proyecto-final-progra3-production.up.railway.app/api',
});
