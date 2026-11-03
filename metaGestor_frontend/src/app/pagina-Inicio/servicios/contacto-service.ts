import { HttpClient } from '@angular/common/http';
import { inject, InjectionToken, Service } from '@angular/core';
import { Observable } from 'rxjs';
import type { RespuestaSolicitud, SolicitudContacto } from '../modelos/solicitud-contacto';

/**
 * URL base de la API. Se puede sobrescribir desde los providers de la app
 * o de las pruebas sin tocar el servicio.
 */
export const URL_API = new InjectionToken<string>('URL_API', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080/api',
});

@Service()
export class ContactoService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);

  enviarSolicitud(solicitud: SolicitudContacto): Observable<RespuestaSolicitud> {
    return this.http.post<RespuestaSolicitud>(`${this.urlApi}/solicitudes/crear`, solicitud);
  }
}
