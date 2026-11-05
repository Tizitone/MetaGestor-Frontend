/** Credenciales que se envian al endpoint de inicio de sesion. */
export interface CredencialesInicioSesion {
  email: string;
  contrasenia: string;
}

/** Respuesta del backend al iniciar sesion correctamente. */
export interface RespuestaInicioSesion {
  token: string;
  rol: string;
  idUsuario: number;
}

/** Datos que espera el backend para dar de alta a un cliente. */
export interface NuevoCliente {
  nombre: string;
  email: string;
  telefono: string;
  dni: number;
  contrasenia: string;
}
