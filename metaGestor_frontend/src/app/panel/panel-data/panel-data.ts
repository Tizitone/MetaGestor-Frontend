import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, map, startWith, Subject, switchMap } from 'rxjs';
import { URL_API } from '../../compartido/url-api';
import type {
  CategoriaTarea,
  Cliente,
  ClienteCreacion,
  Empleado,
  EmpleadoCreacion,
  EmpleadoModificacion,
  Registro,
  RegistroEscritura,
  Solicitud,
  Tarea,
  TareaDetalle,
  TareaEscritura,
} from '../panel.model';

/** Tarea tal como la serializa JPA dentro del historial de un empleado. */
interface TareaJpa {
  id: number;
  categorias: CategoriaTarea;
  titulo: string;
  fecha_de_entrega: string;
  fechaDeRegistro: string;
  descripcion_material: string;
  descripcion_general: string;
  cantidad: number;
}

type EmpleadoJpa = Omit<Empleado, 'historial'> & { historial: TareaJpa[] };

function normalizarEmpleado({ historial, ...empleado }: EmpleadoJpa): Empleado {
  return {
    ...empleado,
    historial: historial.map((tarea) => ({
      idTarea: tarea.id,
      categorias: tarea.categorias,
      titulo: tarea.titulo,
      fechaDeEntrega: tarea.fecha_de_entrega,
      fechaDeRegistro: tarea.fechaDeRegistro,
      descripcionMaterial: tarea.descripcion_material,
      descripcionGeneral: tarea.descripcion_general,
      cantidad: tarea.cantidad,
    })),
  };
}

@Service()
export class PanelData {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);
 idActual = signal<number>(0);
  private readonly idActual$ = toObservable(this.idActual);
  /**
   * Emite cada vez que una operación de escritura termina con éxito para
   * volver a pedir las colecciones del panel.
   */
  private readonly refresco$ = new Subject<void>();
  private readonly cambios$ = this.refresco$.pipe(startWith(undefined));

  readonly clientes = toSignal(
    this.cambios$.pipe(
      switchMap(() => this.http.get<Cliente[]>(`${this.urlApi}/clientes/buscar/all`)),
    ),
    { initialValue: [] },
  );

readonly buscarCliente = toSignal(
    this.idActual$.pipe(
      filter(id => id > 0), // Opcional: evita buscar si el ID es 0
      switchMap(id => this.http.get<Cliente>(`${this.urlApi}/clientes/${id}`))
    ),
    { initialValue: null } // Un cliente individual, no un array
  );
  readonly empleados = toSignal(
    this.cambios$.pipe(
      switchMap(() =>
        this.http
          .get<EmpleadoJpa[]>(`${this.urlApi}/empleados/buscar/all`)
          .pipe(map((empleados) => empleados.map(normalizarEmpleado))),
      ),
    ),
    { initialValue: [] },
  );

  readonly buscarRegistrosCliente = toSignal(this.http.get<Registro[]>(`${this.urlApi}/registros/buscar/cliente/${this.idActual()}`),{
    initialValue: [],
  });

  readonly buscarHistorialEmpleados = toSignal(this.http.get<Tarea[]>(`${this.urlApi}/empleados/historial`),{
    initialValue: [],
  });

  readonly tareas = toSignal(this.http.get<Tarea[]>(`${this.urlApi}/tareas/buscar/all`),{
    initialValue: [],
    }
  );



  readonly solicitudes = toSignal(
     this.http.get<Solicitud[]>(`${this.urlApi}/solicitudes/buscar/all`),
    { initialValue: [] },
  );

  readonly registros = toSignal(this.http.get<Registro[]>(`${this.urlApi}/registros/buscar/all`),
    { initialValue: [] },
  );

  // --- Mutaciones: cada operación recarga las colecciones al terminar. ---

  async crearCliente(cliente: ClienteCreacion): Promise<void> {
    await firstValueFrom(this.http.post<ClienteCreacion>(`${this.urlApi}/clientes`, cliente));
    this.refrescar();
  }

  async modificarCliente(idCliente: number, cliente: Cliente): Promise<void> {
    await firstValueFrom(this.http.put<Cliente>(`${this.urlApi}/clientes/${idCliente}`, cliente));
    this.refrescar();
  }

  async eliminarCliente(idCliente: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/clientes/${idCliente}`));
    this.refrescar();
  }

  async crearEmpleado(empleado: EmpleadoCreacion): Promise<void> {
    await firstValueFrom(this.http.post<EmpleadoCreacion>(`${this.urlApi}/empleados`, empleado));
    this.refrescar();
  }

  async modificarEmpleado(legajo: number, empleado: EmpleadoModificacion): Promise<void> {
    await firstValueFrom(
      this.http.put<EmpleadoModificacion>(`${this.urlApi}/empleados/${legajo}`, empleado),
    );
    this.refrescar();
  }

  async eliminarEmpleado(legajo: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/empleados/${legajo}`));
    this.refrescar();
  }

  async crearTarea(tarea: TareaEscritura): Promise<void> {
    await firstValueFrom(this.http.post<TareaEscritura>(`${this.urlApi}/tareas`, tarea));
    this.refrescar();
  }

  async modificarTarea(idTarea: number, tarea: TareaEscritura): Promise<void> {
    await firstValueFrom(this.http.put<TareaEscritura>(`${this.urlApi}/tareas/${idTarea}`, tarea));
    this.refrescar();
  }

  async eliminarTarea(idTarea: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/tareas/${idTarea}`));
    this.refrescar();
  }

  async crearRegistro(registro: RegistroEscritura): Promise<void> {
    await firstValueFrom(this.http.post<RegistroEscritura>(`${this.urlApi}/registros`, registro));
    this.refrescar();
  }

  async modificarRegistro(id: number, registro: RegistroEscritura): Promise<void> {
    await firstValueFrom(
      this.http.put<RegistroEscritura>(`${this.urlApi}/registros/${id}`, registro),
    );
    this.refrescar();
  }

  async eliminarRegistro(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/registros/${id}`));
    this.refrescar();
  }

  async modificarSolicitud(id: number, solicitud: Solicitud): Promise<void> {
    await firstValueFrom(
      this.http.put<Solicitud>(`${this.urlApi}/solicitudes/${id}`, solicitud),
    );
    this.refrescar();
  }

  async eliminarSolicitud(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.urlApi}/solicitudes/borrar/${id}`));
    this.refrescar();
  }

  private refrescar(): void {
    this.refresco$.next();
  }
  nombreDeCliente(id: number): string {

    return this.clientes().find((cliente) => cliente.idCliente === id)?.nombre ?? `Cliente #${id}`;
  }


  resumenDeTarea(id: number): string {
    const tarea = this.tareas().find((actual) => actual.idTarea === id);
    return tarea?.titulo || tarea?.descripcionGeneral || `Tarea #${id}`;
  }

  nombreDeEmpleado(legajo: number): string {
    return (
      this.empleados().find((empleado) => empleado.legajo === legajo)?.nombre ?? `Legajo #${legajo}`
    );
  }
}
