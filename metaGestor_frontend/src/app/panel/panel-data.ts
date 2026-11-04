import { Service, computed, signal } from '@angular/core';
import type { Cliente, Empleado, Registro, Solicitud, Tarea } from './panel.model';
import { httpResource } from '@angular/common/http';

const API = {
  clientes: '/api/clientes/buscar/all',
  empleados: '/api/empleados/buscar/all',
  tareas: '/api/tareas/buscar/all',
  solicitudes: '/api/solicitudes/buscar/all',
  registros: '/api/registros/buscar/all',
} as const;

@Service()
export class PanelData {
  private readonly clientesResource = httpResource<Cliente[]>(() => API.clientes, {
    defaultValue: [],
  });
  private readonly empleadosResource = httpResource<Empleado[]>(() => API.empleados, {
    defaultValue: [],
  });
  private readonly tareasResource = httpResource<Tarea[]>(() => API.tareas, {
    defaultValue: [],
  });
  private readonly solicitudesResource = httpResource<Solicitud[]>(() => API.solicitudes, {
    defaultValue: [],
  });
  private readonly registrosResource = httpResource<Registro[]>(() => API.registros, {
    defaultValue: [],
  });

  readonly clientes = computed<readonly Cliente[]>(() =>
    this.clientesResource.hasValue() ? this.clientesResource.value() : [],
  );
  readonly empleados = computed<readonly Empleado[]>(() =>
    this.empleadosResource.hasValue() ? this.empleadosResource.value() : [],
  );
  readonly tareas = computed<readonly Tarea[]>(() =>
    this.tareasResource.hasValue() ? this.tareasResource.value() : [],
  );
  readonly solicitudes = computed<readonly Solicitud[]>(() =>
    this.solicitudesResource.hasValue() ? this.solicitudesResource.value() : [],
  );
  readonly registros = computed<readonly Registro[]>(() =>
    this.registrosResource.hasValue() ? this.registrosResource.value() : [],
  );

  readonly clientesPorId = computed(
    () => new Map(this.clientes().map((cliente) => [cliente.idCliente, cliente])),
  );

  readonly tareasPorId = computed(
    () => new Map(this.tareas().map((tarea) => [tarea.idTarea, tarea])),
  );

  readonly empleadosPorLegajo = computed(
    () => new Map(this.empleados().map((empleado) => [empleado.legajo, empleado])),
  );

  nombreDeCliente(id: number): string {
    return this.clientesPorId().get(id)?.nombre ?? `Cliente #${id}`;
  }

  resumenDeTarea(id: number): string {
    return this.tareasPorId().get(id)?.descripcionGeneral ?? `Tarea #${id}`;
  }

  nombreDeEmpleado(legajo: number): string {
    return this.empleadosPorLegajo().get(legajo)?.nombre ?? `Legajo #${legajo}`;
  }
}

