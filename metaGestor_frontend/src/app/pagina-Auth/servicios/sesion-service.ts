import { DOCUMENT, inject, Service } from '@angular/core';
import type { RespuestaInicioSesion } from '../modelos/credenciales';

const CLAVE_SESION = 'metagestor.sesion';

@Service()
export class SesionService {
  private readonly documento = inject(DOCUMENT);

  guardarSesion(sesion: RespuestaInicioSesion): void {
    this.documento.defaultView?.sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }

  cerrarSesion(): void {
    this.documento.defaultView?.sessionStorage.removeItem(CLAVE_SESION);
  }
}
