import { InjectionToken } from '@angular/core';

/**
 * URL base de la API. Se puede sobrescribir desde los providers de la app
 * o de las pruebas sin tocar los servicios.
 */
export const URL_API = new InjectionToken<string>('URL_API', {
  providedIn: 'root',
  factory: () => 'https://proyecto-final-progra3-production.up.railway.app/api',
});
