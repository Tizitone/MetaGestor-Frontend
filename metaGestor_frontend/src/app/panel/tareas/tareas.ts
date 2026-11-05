import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  DataTable,
  type BadgeTone,
  type FilterOption,
  type TableColumn,
} from '../data-table/data-table';
import { formatDate, formatDateTime } from '../format';
import { PanelData } from '../panel-data';
import { CATEGORIA_LABEL, type CategoriaTarea, type Tarea } from '../panel.model';

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
  imports: [DataTable],
  templateUrl: './tareas.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tareas {
  private readonly data = inject(PanelData);

  protected readonly tareas = this.data.tareas;

  protected readonly rowId = (tarea: Tarea): number => tarea.idTarea;

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
  ];
}
