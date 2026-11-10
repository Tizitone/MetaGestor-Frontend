import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormTarea } from './form-tarea/form-tarea';
import { PanelData } from '../../panel-data/panel-data';
import { CATEGORIA_LABEL, CategoriaTarea, Tarea } from '../../panel.model';
import { BadgeTone, DataTable, FilterOption, TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { formatDate, formatDateTime } from '../../extras/format';

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
  imports: [DataTable, FormTarea, Modal],
  templateUrl: './tareas.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tareas {
  private readonly data = inject(PanelData);

  protected readonly tareas = this.data.tareas;

  // --- Alta y modificación ---

  protected readonly modalAbierta = signal(false);
  protected readonly tareaEnEdicion = signal<Tarea | null>(null);
  protected readonly tituloModal = computed(() =>
    this.tareaEnEdicion() === null ? 'Nueva tarea' : 'Modificar tarea',
  );

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
      value: (tarea) => tarea.titulo,
      filter: 'text',
      filterPlaceholder: 'Nombre del trabajo',
      width: '14rem',
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
      width: '8rem',
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
      key: 'fechaDeRegistro',
      header: 'Registro',
      value: (tarea) => tarea.fechaDeRegistro,
      display: (tarea) => formatDateTime(tarea.fechaDeRegistro),
      width: '11rem',
    },
    {
      key: 'descripcionMaterial',
      header: 'Material',
      value: (tarea) => tarea.descripcionMaterial,
      filter: 'text',
      filterPlaceholder: 'Acero, aluminio…',
      width: '15rem',
    },
    {
      key: 'descripcionGeneral',
      header: 'Descripción',
      value: (tarea) => tarea.descripcionGeneral,
      filter: 'text',
      filterPlaceholder: 'Trabajo a realizar',
      width: '18rem',
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
