/**
 * Contratos de datos del panel.
 *
 * Cada interfaz refleja un DTO del backend (Proyecto-Final-Progra3). Los
 * identificadores se mantienen con el mismo nombre que envía la API para que
 * reemplazar los datos de ejemplo por una llamada HTTP no requiera cambios.
 */

export type CategoriaTarea = 'LIGERO' | 'MEDIANO' | 'PESADO';

export type ProcesoRegistro = 'ESPERA' | 'ENPROCESO' | 'TERMINADO';

export type CategoriaEmpleado =
  | 'SIN_CATEGORIA'
  | 'TORNERO'
  | 'SOLDADOR'
  | 'CORTADOR'
  | 'AYUDANTE';

/** Equivale a `TareaDTO`. */
export interface Tarea {
  readonly idTarea: number;
  readonly categorias: CategoriaTarea;
  readonly titulo: string;
  readonly fechaDeEntrega: string;
  readonly fechaDeRegistro: string;
  readonly descripcionMaterial: string;
  readonly descripcionGeneral: string;
  readonly cantidad: number;
}
export interface TareaDetalle {
  readonly idTarea: number;
  readonly categorias: CategoriaTarea;
  readonly titulo: string;
  readonly fechaDeRegistro: string;
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
  readonly categoriaEmpleado: CategoriaEmpleado;
  readonly historial: readonly Tarea[];
}

/** Equivale a `GerenteDTO`. */
export interface Gerente {
  readonly legajo: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly dni: number;
}

/** Equivale a `SolicitudDTO`. */
export interface Solicitud {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly descripcion: string;
  readonly atendido: boolean;
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

export const CATEGORIA_EMPLEADO_LABEL: Readonly<Record<CategoriaEmpleado, string>> = {
  SIN_CATEGORIA: 'Sin categoría',
  TORNERO: 'Tornero',
  SOLDADOR: 'Soldador',
  CORTADOR: 'Cortador',
  AYUDANTE: 'Ayudante',
};

export const PROCESO_LABEL: Readonly<Record<ProcesoRegistro, string>> = {
  ESPERA: 'En espera',
  ENPROCESO: 'En proceso',
  TERMINADO: 'Terminado',
};

/** Payload de alta de cliente (`CrearClienteDTO`). */
export interface ClienteCreacion {
  readonly email: string;
  readonly contrasenia: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly dni: number;
}

/** Payload de alta de empleado (`CrearEmpleadoDTO`). */
export interface EmpleadoCreacion {
  readonly email: string;
  readonly contrasenia: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly dni: number;
  readonly categoriaEmpleado: CategoriaEmpleado;
}

/** Payload de modificación de empleado (`EmpleadoDTO`, sin contraseña). */
export interface EmpleadoModificacion {
  readonly email: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly dni: number;
  readonly legajo: number;
  readonly categoriaEmpleado: CategoriaEmpleado;
  readonly historial: readonly Tarea[];
}

/** Payload de alta y modificación de tarea (`CrearTareaDTO`). */
export interface TareaEscritura {
  readonly titulo: string;
  readonly categorias: CategoriaTarea;
  readonly fechaDeEntrega: string;
  readonly descripcionMaterial: string;
  readonly descripcionGeneral: string;
  readonly cant: number;
}

/** Payload de alta y modificación de registro (`CrearRegistroDTO`). */
export interface RegistroEscritura {
  readonly titulo: string;
  readonly tareaId: number;
  readonly clienteId: number;
  readonly proceso: ProcesoRegistro;
  readonly participantesId: readonly number[];
  readonly publicado: boolean;
}
