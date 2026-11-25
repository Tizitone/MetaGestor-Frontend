import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormTarea } from './form-tarea/form-tarea';
import { PanelData } from '../../panel-data/panel-data';
import { CATEGORIA_LABEL, CategoriaTarea, Tarea } from '../../panel.model';
import { BadgeTone, DataTable, FilterOption, TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { formatDate, formatDateTime } from '../../extras/format';
import { SesionService } from '../../../pagina-Auth/servicios/sesion-service';

const CATEGORIA_OPTIONS: readonly FilterOption[] = (
  Object.keys(CATEGORIA_LABEL) as CategoriaTarea[]
).map((value) => ({ value, label: CATEGORIA_LABEL[value] }));

function toneCategoria(tarea: Tarea): BadgeTone {
  switch (tarea.categorias) {
    case 'PESADO':
      return 'warning';
    case 'MEDIANO':
      return 'info';
    default:
      return 'neutral';
  }
}

@Component({
  selector: 'app-tareas',
  imports: [DataTable, FormTarea, Modal, RouterLink],
  templateUrl: './tareas.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tareas {
  private readonly data = inject(PanelData);
  private readonly sesion = inject(SesionService);

  /**
   * El empleado solo consulta las tareas de su historial. La creación,
   * modificación y baja quedan reservadas a los roles de gestión.
   */
  protected readonly esEmpleado = computed(() =>
    (this.sesion.rol() ?? '').toUpperCase().includes('EMPLEADO'),
  );

  protected readonly idUsuario = this.sesion.idUsuario;
  protected readonly puedeExportar = this.data.puedeExportar;

  protected readonly tareas = computed<readonly Tarea[]>(() =>
    this.esEmpleado() ? this.data.buscarHistorialEmpleados() : this.data.tareas(),
  );

  // --- Alta y modificación ---

  protected readonly modalAbierta = signal(false);
  protected readonly tareaEnEdicion = signal<Tarea | null>(null);
  protected readonly tituloModal = computed(() =>
    this.tareaEnEdicion() === null ? 'Nueva tarea' : 'Modificar tarea',
  );

  // --- Detalle ---

  protected readonly detalleAbierto = signal(false);
  protected readonly tareaDetalle = signal<Tarea | null>(null);
  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly formatearFecha = formatDate;
  protected readonly formatearFechaHora = formatDateTime;

  // --- Baja ---

  protected readonly errorEliminar = signal('');

  protected readonly rowId = (tarea: Tarea): number => tarea.idTarea;

  protected abrirCreacion(): void {
    this.tareaEnEdicion.set(null);
    this.modalAbierta.set(true);
  }

  protected abrirModificacion(tarea: Tarea): void {
    this.tareaEnEdicion.set(tarea);
    this.modalAbierta.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierta.set(false);
  }

  protected verDetalle(tarea: Tarea): void {
    this.tareaDetalle.set(tarea);
    this.detalleAbierto.set(true);
  }

  protected cerrarDetalle(): void {
    this.detalleAbierto.set(false);
  }

  protected async eliminar(tarea: Tarea): Promise<void> {
    this.errorEliminar.set('');

    try {
      await this.data.eliminarTarea(tarea.idTarea);
    } catch {
      this.errorEliminar.set('No se pudo eliminar la tarea. Intenta nuevamente.');
    }
  }

  protected readonly columns: readonly TableColumn<Tarea>[] = [
    {
      key: 'idTarea',
      header: 'ID',
      value: (tarea) => String(tarea.idTarea),
      kind: 'mono',
      align: 'end',
      width: '4.5rem',
    },
    {
      key: 'titulo',
      header: 'Título',
      value: (tarea) => tarea.titulo || tarea.descripcionGeneral,
      display: (tarea) => tarea.titulo || tarea.descripcionGeneral,
      filter: 'text',
      filterPlaceholder: 'Nombre del trabajo',
      width: '16rem',
    },
    {
      key: 'categorias',
      header: 'Categoría',
      value: (tarea) => tarea.categorias,
      display: (tarea) => CATEGORIA_LABEL[tarea.categorias],
      kind: 'badge',
      tone: toneCategoria,
      filter: 'select',
      filterOptions: CATEGORIA_OPTIONS,
      width: '8.5rem',
    },
    {
      key: 'fechaDeEntrega',
      header: 'Entrega',
      value: (tarea) => tarea.fechaDeEntrega,
      display: (tarea) => formatDate(tarea.fechaDeEntrega),
      filter: 'text',
      filterPlaceholder: 'AAAA-MM-DD',
      width: '8.5rem',
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      value: (tarea) => String(tarea.cantidad),
      align: 'end',
      width: '6.5rem',
    },
  ];
}
