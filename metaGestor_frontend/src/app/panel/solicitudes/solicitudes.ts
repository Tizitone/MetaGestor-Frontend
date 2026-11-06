import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTable, type TableColumn } from '../data-table/data-table';
import { PanelData } from '../panel-data';
import type { Solicitud } from '../panel.model';

@Component({
  selector: 'app-solicitudes',
  imports: [DataTable],
  templateUrl: './solicitudes.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitudes {
  private readonly data = inject(PanelData);

  protected readonly solicitudes = this.data.solicitudes;

  protected readonly rowId = (solicitud: Solicitud): number => solicitud.id;

  protected readonly columns: readonly TableColumn<Solicitud>[] = [
    {
      key: 'id',
      header: 'ID',
      value: (solicitud) => String(solicitud.id),
      kind: 'mono',
      align: 'end',
      width: '4.5rem',
    },
    {
      key: 'nombre',
      header: 'Solicitante',
      value: (solicitud) => solicitud.nombre,
      filter: 'text',
      filterPlaceholder: 'Nombre o apellido',
      width: '12rem',
    },
    {
      key: 'email',
      header: 'Correo',
      value: (solicitud) => solicitud.email,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: 'usuario@dominio.cl',
      width: '17rem',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      value: (solicitud) => solicitud.telefono,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: '9 dígitos',
      width: '9rem',
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      value: (solicitud) => solicitud.descripcion,
      filter: 'text',
      filterPlaceholder: 'Palabra clave',
      width: '26rem',
    },
  ];
}
