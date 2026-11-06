/** Datos que se envían al backend al crear una solicitud de contacto. */
export interface SolicitudContacto {
  nombre: string;
  email: string;
  telefono: string;
  descripcion: string;
}

/** Respuesta del backend al crear la solicitud. */
export interface RespuestaSolicitud extends SolicitudContacto {
  id: number;
}
