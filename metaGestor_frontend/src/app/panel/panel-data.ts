import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { URL_API } from '../compartido/url-api';
import type { CategoriaTarea, Cliente, Empleado, Registro, Solicitud, Tarea } from './panel.model';

/** Tarea tal como la serializa JPA dentro del historial de un empleado. */
interface TareaJpa {
  id: number;
  categorias: CategoriaTarea;
  fecha_de_entrega: string;
  fechaDeRegistro: string;
  descripcion_material: string;
  descripcion_general: string;
}

type EmpleadoJpa = Omit<Empleado, 'historial'> & { historial: TareaJpa[] };

function normalizarEmpleado({ historial, ...empleado }: EmpleadoJpa): Empleado {
  return {
    ...empleado,
    historial: historial.map((tarea) => ({
      idTarea: tarea.id,
      categorias: tarea.categorias,
      fechaDeEntrega: tarea.fecha_de_entrega,
      fechaDeRegistro: tarea.fechaDeRegistro,
      descripcionMaterial: tarea.descripcion_material,
      descripcionGeneral: tarea.descripcion_general,
    })),
  };
}

@Service()
export class PanelData {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);
  idActual = signal<number>(0);

  readonly clientes = toSignal(this.http.get<Cliente[]>(`${this.urlApi}/clientes/buscar/all`), {
    initialValue: [],
  });

  readonly empleados = toSignal(
    this.http
      .get<EmpleadoJpa[]>(`${this.urlApi}/empleados/buscar/all`)
      .pipe(map((empleados) => empleados.map(normalizarEmpleado))),
    { initialValue: [] },
  );

  readonly buscarRegistrosCliente = toSignal(this.http.get<Registro[]>(`${this.urlApi}/registros/buscar/cliente/${this.idActual}`),{
    initialValue: [],
  });

  readonly buscarHistorialEmpleados = toSignal(this.http.get<Tarea[]>(`${this.urlApi}/empleados/historial`),{
    initialValue: [],
  });

  readonly tareas = toSignal(this.http.get<Tarea[]>(`${this.urlApi}/tareas/buscar/all`), {
    initialValue: [],
  });

  readonly solicitudes = toSignal(
    this.http.get<Solicitud[]>(`${this.urlApi}/solicitudes/buscar/all`),
    { initialValue: [] },
  );

  readonly registros = toSignal(this.http.get<Registro[]>(`${this.urlApi}/registros/buscar/all`), {
    initialValue: [],
  });

  nombreDeCliente(id: number): string {
    return this.clientes().find((cliente) => cliente.idCliente === id)?.nombre ?? `Cliente #${id}`;
  }

  resumenDeTarea(id: number): string {
    return (
      this.tareas().find((tarea) => tarea.idTarea === id)?.descripcionGeneral ?? `Tarea #${id}`
    );
  }

  nombreDeEmpleado(legajo: number): string {
    return (
      this.empleados().find((empleado) => empleado.legajo === legajo)?.nombre ?? `Legajo #${legajo}`
    );
  }
}
