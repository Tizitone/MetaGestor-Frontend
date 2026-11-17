import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataTable, type TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { PanelData } from '../../panel-data/panel-data';
import type { Gerente } from '../../panel.model';
import { FormGerente } from './form-gerente/form-gerente';

@Component({
  selector: 'app-gerentes',
  imports: [DataTable, FormGerente, Modal],
  templateUrl: './gerentes.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gerentes {
  private readonly data = inject(PanelData);

  protected readonly gerentes = this.data.gerentes;

  // --- Alta y modificación ---

  protected readonly modalAbierta = signal(false);
  protected readonly gerenteEnEdicion = signal<Gerente | null>(null);
  protected readonly tituloModal = computed(() =>
    this.gerenteEnEdicion() === null ? 'Nuevo gerente' : 'Modificar gerente',
  );

  // --- Baja ---

  protected readonly errorEliminar = signal('');

  protected readonly rowId = (gerente: Gerente): number => gerente.legajo;

  protected abrirCreacion(): void {
    this.gerenteEnEdicion.set(null);
    this.modalAbierta.set(true);
  }

  protected abrirModificacion(gerente: Gerente): void {
    this.gerenteEnEdicion.set(gerente);
    this.modalAbierta.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierta.set(false);
  }

  protected async eliminar(gerente: Gerente): Promise<void> {
    this.errorEliminar.set('');

    try {
      await this.data.eliminarGerente(gerente.legajo);
    } catch {
      this.errorEliminar.set('No se pudo eliminar el gerente. Intenta nuevamente.');
    }
  }

  protected readonly columns: readonly TableColumn<Gerente>[] = [
    {
      key: 'legajo',
      header: 'Legajo',
      value: (gerente) => String(gerente.legajo),
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: 'Número de legajo',
      width: '7rem',
    },
    {
      key: 'nombre',
      header: 'Nombre',
      value: (gerente) => gerente.nombre,
      filter: 'text',
      filterPlaceholder: 'Nombre o apellido',
      width: '13rem',
    },
    {
      key: 'email',
      header: 'Correo',
      value: (gerente) => gerente.email,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: 'usuario@dominio.cl',
      width: '17rem',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      value: (gerente) => gerente.telefono,
      kind: 'mono',
      filter: 'text',
      filterPlaceholder: '9 dígitos',
      width: '9rem',
    },
    {
      key: 'dni',
      header: 'DNI',
      value: (gerente) => String(gerente.dni),
      kind: 'mono',
      align: 'end',
      filter: 'text',
      filterPlaceholder: 'Documento',
      width: '8rem',
    },
    {
      key: 'perfil',
      header: 'Perfil',
      value: (gerente) => String(gerente.legajo),
      display: () => 'Ver perfil',
      link: (gerente) => `/panel/gerentes/${gerente.legajo}`,
      sortable: false,
      width: '7.5rem',
    },
  ];
}
