import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DataTable, type TableColumn } from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { PanelData } from '../../panel-data/panel-data';
import type { Solicitud } from '../../panel.model';
import { FormSolicitud } from './form-solicitud/form-solicitud';

@Component({
  selector: 'app-solicitudes',
  imports: [DataTable, FormSolicitud, Modal],
  templateUrl: './solicitudes.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Solicitudes {
  private readonly data = inject(PanelData);

  protected readonly solicitudes = this.data.solicitudes;

  // --- Modificación ---

  // Las solicitudes nacen del formulario de contacto del sitio público, así
  // que acá solo se editan o se eliminan.
  protected readonly modalAbierta = signal(false);
  protected readonly solicitudEnEdicion = signal<Solicitud | null>(null);

  // --- Baja ---

  protected readonly errorEliminar = signal('');

  protected readonly rowId = (solicitud: Solicitud): number => solicitud.id;

  protected abrirModificacion(solicitud: Solicitud): void {
    this.solicitudEnEdicion.set(solicitud);
    this.modalAbierta.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierta.set(false);
  }

  protected async eliminar(solicitud: Solicitud): Promise<void> {
    this.errorEliminar.set('');

    try {
      await this.data.eliminarSolicitud(solicitud.id);
    } catch {
      this.errorEliminar.set('No se pudo eliminar la solicitud. Intenta nuevamente.');
    }
  }

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
