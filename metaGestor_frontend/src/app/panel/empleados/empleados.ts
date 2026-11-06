import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTable, type TableColumn } from '../data-table/data-table';
import { pluralize } from '../format';
import { PanelData } from '../panel-data';
import type { Empleado } from '../panel.model';

@Component({
  selector: 'app-empleados',
  imports: [DataTable],
  templateUrl: './empleados.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Empleados {
  private readonly data = inject(PanelData);

  protected readonly empleados = this.data.empleados;

  protected readonly rowId = (empleado: Empleado): number => empleado.legajo;

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
