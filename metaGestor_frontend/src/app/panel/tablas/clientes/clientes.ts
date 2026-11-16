import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataTable, type TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { PanelData } from '../../panel-data/panel-data';
import type { Cliente } from '../../panel.model';
import { FormCliente } from './form-cliente/form-cliente';

@Component({
  selector: 'app-clientes',
  imports: [DataTable, FormCliente, Modal],
  templateUrl: './clientes.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clientes {
  private readonly data = inject(PanelData);

  protected readonly clientes = this.data.clientes;

  // --- Alta y modificación ---

  protected readonly modalAbierta = signal(false);
  protected readonly clienteEnEdicion = signal<Cliente | null>(null);
  protected readonly tituloModal = computed(() =>
    this.clienteEnEdicion() === null ? 'Nuevo cliente' : 'Modificar cliente',
  );

  // --- Baja ---

  protected readonly errorEliminar = signal('');

  protected readonly rowId = (cliente: Cliente): number => cliente.idCliente;

  protected abrirCreacion(): void {
    this.clienteEnEdicion.set(null);
    this.modalAbierta.set(true);
  }

  protected abrirModificacion(cliente: Cliente): void {
    this.clienteEnEdicion.set(cliente);
    this.modalAbierta.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierta.set(false);
  }

  protected async eliminar(cliente: Cliente): Promise<void> {
    this.errorEliminar.set('');

    try {
      await this.data.eliminarCliente(cliente.idCliente);
    } catch {
      this.errorEliminar.set('No se pudo eliminar el cliente. Intenta nuevamente.');
    }
  }

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
    {
      key: 'perfil',
      header: 'Perfil',
      value: () => 'Ver perfil',
      link: (cliente) => `/panel/clientes/${cliente.idCliente}`,
      sortable: false,
      width: '6.5rem',
    },
  ];
}
