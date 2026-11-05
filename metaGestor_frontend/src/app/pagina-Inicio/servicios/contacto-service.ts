import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_API } from '../../compartido/url-api';
import type { RespuestaSolicitud, SolicitudContacto } from '../modelos/solicitud-contacto';

@Service()
export class ContactoService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);

  enviarSolicitud(solicitud: SolicitudContacto): Observable<RespuestaSolicitud> {
    return this.http.post<RespuestaSolicitud>(`${this.urlApi}/solicitudes/crear`, solicitud);
  }
}
