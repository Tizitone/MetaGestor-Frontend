import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataTable, type TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { PanelData } from '../../panel-data/panel-data';
import type { Empleado } from '../../panel.model';
import { FormEmpleado } from './form-empleado/form-empleado';
import { pluralize } from '../../extras/format';

@Component({
  selector: 'app-empleados',
  imports: [DataTable, FormEmpleado, Modal],
  templateUrl: './empleados.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Empleados {
  private readonly data = inject(PanelData);

  protected readonly empleados = this.data.empleados;

  // --- Alta y modificación ---

  protected readonly modalAbierta = signal(false);
  protected readonly empleadoEnEdicion = signal<Empleado | null>(null);
  protected readonly tituloModal = computed(() =>
    this.empleadoEnEdicion() === null ? 'Nuevo empleado' : 'Modificar empleado',
  );

  // --- Baja ---

  protected readonly errorEliminar = signal('');

  protected readonly rowId = (empleado: Empleado): number => empleado.legajo;

  protected abrirCreacion(): void {
    this.empleadoEnEdicion.set(null);
    this.modalAbierta.set(true);
  }

  protected abrirModificacion(empleado: Empleado): void {
    this.empleadoEnEdicion.set(empleado);
    this.modalAbierta.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierta.set(false);
  }

  protected async eliminar(empleado: Empleado): Promise<void> {
    this.errorEliminar.set('');

    try {
      await this.data.eliminarEmpleado(empleado.legajo);
    } catch {
      this.errorEliminar.set('No se pudo eliminar el empleado. Intenta nuevamente.');
    }
  }

  protected readonly columns: readonly TableColumn<Empleado>[] = [
    {
      key: 'legajo',
      header: 'Legajo',
      value: (empleado) => String(empleado.legajo),
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: 'Número de legajo',
      width: '7rem',
    },
    {
      key: 'nombre',
      header: 'Nombre',
      value: (empleado) => empleado.nombre,
      filter: 'text',
      filterPlaceholder: 'Nombre o apellido',
      width: '13rem',
    },
    {
      key: 'email',
      header: 'Correo',
      value: (empleado) => empleado.email,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: 'usuario@dominio.cl',
      width: '16rem',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      value: (empleado) => empleado.telefono,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: '9 dígitos',
      width: '9rem',
    },
    {
      key: 'dni',
      header: 'DNI',
      value: (empleado) => String(empleado.dni),
      kind: 'mono',
      align: 'end',
      filter: 'text',
      filterPlaceholder: 'Documento',
      width: '8rem',
    },
    {
      key: 'historial',
      header: 'Historial',
      value: (empleado) => String(empleado.historial.length),
      display: (empleado) => pluralize(empleado.historial.length, 'tarea', 'tareas'),
      align: 'end',
      width: '7rem',
    },
  ];
}
