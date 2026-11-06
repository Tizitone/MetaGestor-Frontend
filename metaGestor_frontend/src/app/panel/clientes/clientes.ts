import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataTable, type TableColumn } from '../data-table/data-table';
import { PanelData } from '../panel-data';
import type { Cliente } from '../panel.model';

@Component({
  selector: 'app-clientes',
  imports: [DataTable],
  templateUrl: './clientes.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clientes {
  private readonly data = inject(PanelData);

  protected readonly clientes = this.data.clientes;

  protected readonly rowId = (cliente: Cliente): number => cliente.idCliente;

  protected readonly columns: readonly TableColumn<Cliente>[] = [
    {
      key: 'idCliente',
      header: 'ID',
      value: (cliente) => String(cliente.idCliente),
      kind: 'mono',
      align: 'end',
      width: '5.5rem',
    },
    {
      key: 'nombre',
      header: 'Nombre',
      value: (cliente) => cliente.nombre,
      filter: 'text',
      filterPlaceholder: 'Nombre o apellido',
      width: '13rem',
    },
    {
      key: 'email',
      header: 'Correo',
      value: (cliente) => cliente.email,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: 'usuario@dominio.cl',
      width: '17rem',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      value: (cliente) => cliente.telefono,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: '9 dígitos',
      width: '9rem',
    },
    {
      key: 'dni',
      header: 'DNI',
      value: (cliente) => String(cliente.dni),
      kind: 'mono',
      align: 'end',
      filter: 'text',
      filterPlaceholder: 'Documento',
      width: '8rem',
    },
  ];
}
