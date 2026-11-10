import { computed, inject, Service, signal } from '@angular/core';
import type { RespuestaInicioSesion } from '../modelos/credenciales';

/** Clave con la que se guarda la sesion en `sessionStorage`. */
export const CLAVE_SESION = 'metagestor.sesion';

@Service()
export class SesionService {
  private readonly sesionSignal = signal<RespuestaInicioSesion | null>(this.leerSesion());

  readonly token = computed(() => this.sesionSignal()?.token ?? null);
  readonly rol = computed(() => this.sesionSignal()?.rol ?? null);
  readonly idUsuario = computed(() => this.sesionSignal()?.idUsuario ?? null);

  guardarSesion(sesion: RespuestaInicioSesion): void {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesionSignal.set(sesion);
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesionSignal.set(null);
  }

  private leerSesion(): RespuestaInicioSesion | null {
    const valor = sessionStorage.getItem(CLAVE_SESION);
    return valor ? (JSON.parse(valor) as RespuestaInicioSesion) : null;
  }
}
