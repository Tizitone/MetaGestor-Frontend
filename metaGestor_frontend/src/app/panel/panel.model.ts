/**
 * Contratos de datos del panel.
 *
 * Cada interfaz refleja un DTO del backend (Proyecto-Final-Progra3). Los
 * identificadores se mantienen con el mismo nombre que envía la API para que
 * reemplazar los datos de ejemplo por una llamada HTTP no requiera cambios.
 */

export type CategoriaTarea = 'LIGERO' | 'MEDIANO' | 'PESADO';

export type ProcesoRegistro = 'ESPERA' | 'ENPROCESO' | 'TERMINADO';

/** Equivale a `TareaDTO`. */
export interface Tarea {
  readonly idTarea: number;
  readonly categorias: CategoriaTarea;
  readonly fechaDeEntrega: string;
  readonly fechaDeRegistro: string;
  readonly descripcionMaterial: string;
  readonly descripcionGeneral: string;
}

/** Equivale a `ClienteDTO`. */
export interface Cliente {
  readonly idCliente: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly dni: number;
}

/** Equivale a `EmpleadoDTO`. */
export interface Empleado {
  readonly legajo: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly dni: number;
  readonly historial: readonly Tarea[];
}

/** Equivale a `SolicitudDTO`. */
export interface Solicitud {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly descripcion: string;
}

/** Equivale a `RegistroDTO`. */
export interface Registro {
  readonly id: number;
  readonly titulo: string;
  readonly tareaId: number;
  readonly clienteId: number;
  readonly proceso: ProcesoRegistro;
  readonly participantesId: readonly number[];
  readonly publicado: boolean;
}

export const CATEGORIA_LABEL: Readonly<Record<CategoriaTarea, string>> = {
  LIGERO: 'Ligero',
  MEDIANO: 'Mediano',
  PESADO: 'Pesado',
};

export const PROCESO_LABEL: Readonly<Record<ProcesoRegistro, string>> = {
  ESPERA: 'En espera',
  ENPROCESO: 'En proceso',
  TERMINADO: 'Terminado',
};
