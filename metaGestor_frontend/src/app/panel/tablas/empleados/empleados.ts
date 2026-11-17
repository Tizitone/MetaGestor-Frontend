import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BadgeTone, DataTable, FilterOption, type TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { PanelData } from '../../panel-data/panel-data';
import {
  CATEGORIA_EMPLEADO_LABEL,
  type CategoriaEmpleado,
  type Empleado,
} from '../../panel.model';
import { FormEmpleado } from './form-empleado/form-empleado';
import { pluralize } from '../../extras/format';

const CATEGORIA_EMPLEADO_OPTIONS: readonly FilterOption[] = (
  Object.keys(CATEGORIA_EMPLEADO_LABEL) as CategoriaEmpleado[]
).map((value) => ({ value, label: CATEGORIA_EMPLEADO_LABEL[value] }));

function toneCategoriaEmpleado(empleado: Empleado): BadgeTone {
  switch (empleado.categoriaEmpleado) {
    case 'TORNERO':
      return 'info';
    case 'SOLDADOR':
      return 'warning';
    case 'CORTADOR':
      return 'success';
    case 'AYUDANTE':
      return 'neutral';
    default:
      return 'neutral';
  }
}

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
      key: 'categoriaEmpleado',
      header: 'Tipo',
      value: (empleado) => empleado.categoriaEmpleado,
      display: (empleado) => CATEGORIA_EMPLEADO_LABEL[empleado.categoriaEmpleado],
      kind: 'badge',
      tone: toneCategoriaEmpleado,
      filter: 'select',
      filterOptions: CATEGORIA_EMPLEADO_OPTIONS,
      width: '8.5rem',
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
    {
      key: 'perfil',
      header: 'Perfil',
      value: (empleado) => String(empleado.legajo),
      display: () => 'Ver perfil',
      link: (empleado) => `/panel/empleados/${empleado.legajo}`,
      sortable: false,
      width: '7.5rem',
    },
  ];
}
