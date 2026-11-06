import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { URL_API } from '../../compartido/url-api';
import type {
  CredencialesInicioSesion,
  NuevoCliente,
  RespuestaInicioSesion,
} from '../modelos/credenciales';

@Service()
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);

  iniciarSesion(credenciales: CredencialesInicioSesion): Observable<RespuestaInicioSesion> {
    return this.http.post<RespuestaInicioSesion>(`${this.urlApi}/auth/login`, credenciales);
  }

  registrarCliente(cliente: NuevoCliente): Observable<NuevoCliente> {
    return this.http.post<NuevoCliente>(`${this.urlApi}/clientes`, cliente);
  }
}
