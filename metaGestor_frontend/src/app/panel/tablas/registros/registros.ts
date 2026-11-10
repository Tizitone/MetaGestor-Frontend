import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  DataTable,
  type BadgeTone,
  type FilterOption,
  type TableColumn,
} from '../../data-table/data-table';
import { Modal } from '../../modal/modal';
import { PanelData } from '../../panel-data/panel-data';
import { PROCESO_LABEL, type ProcesoRegistro, type Registro } from '../../panel.model';
import { FormRegistro } from './form-registro/form-registro';

/** Registro enriquecido con los nombres que referencia por ID. */
interface RegistroVista extends Registro {
  readonly clienteNombre: string;
  readonly tareaDescripcion: string;
  readonly participantes: string;
}

const PROCESO_OPTIONS: readonly FilterOption[] = (
  Object.keys(PROCESO_LABEL) as ProcesoRegistro[]
).map((value) => ({ value, label: PROCESO_LABEL[value] }));

const PUBLICADO_OPTIONS: readonly FilterOption[] = [
  { value: 'true', label: 'Publicado' },
  { value: 'false', label: 'Sin publicar' },
];

function toneProceso(registro: RegistroVista): BadgeTone {
  switch (registro.proceso) {
    case 'TERMINADO':
      return 'success';
    case 'ENPROCESO':
      return 'info';
    default:
      return 'warning';
  }
}

function tonePublicado(registro: RegistroVista): BadgeTone {
  return registro.publicado ? 'success' : 'neutral';
}

@Component({
  selector: 'app-registros',
  imports: [DataTable, FormRegistro, Modal],
  templateUrl: './registros.html',
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registros {
  private readonly data = inject(PanelData);

  protected readonly registros = computed<readonly RegistroVista[]>(() =>
    this.data.registros().map((registro) => ({
      ...registro,
      clienteNombre: this.data.nombreDeCliente(registro.clienteId),
      tareaDescripcion: this.data.resumenDeTarea(registro.tareaId),
      participantes:
        registro.participantesId.map((legajo) => this.data.nombreDeEmpleado(legajo)).join(', ') ||
        'Sin participantes',
    })),
  );

  // --- Alta y modificación ---

  protected readonly modalAbierta = signal(false);
  protected readonly registroEnEdicion = signal<Registro | null>(null);
  protected readonly tituloModal = computed(() =>
    this.registroEnEdicion() === null ? 'Nuevo registro' : 'Modificar registro',
  );

  // --- Baja ---

  protected readonly errorEliminar = signal('');

  protected readonly rowId = (registro: RegistroVista): number => registro.id;

  protected abrirCreacion(): void {
    this.registroEnEdicion.set(null);
    this.modalAbierta.set(true);
  }

  protected abrirModificacion(registro: RegistroVista): void {
    this.registroEnEdicion.set(registro);
    this.modalAbierta.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierta.set(false);
  }

  protected async eliminar(registro: RegistroVista): Promise<void> {
    this.errorEliminar.set('');

    try {
      await this.data.eliminarRegistro(registro.id);
    } catch {
      this.errorEliminar.set('No se pudo eliminar el registro. Intenta nuevamente.');
    }
  }

  protected readonly columns: readonly TableColumn<RegistroVista>[] = [
    {
      key: 'id',
      header: 'ID',
      value: (registro) => String(registro.id),
      kind: 'mono',
      align: 'end',
      width: '4.5rem',
    },
    {
      key: 'titulo',
      header: 'Título',
      value: (registro) => registro.titulo,
      filter: 'text',
      filterPlaceholder: 'Nombre del trabajo',
      width: '15rem',
    },
    {
      key: 'clienteNombre',
      header: 'Cliente',
      value: (registro) => registro.clienteNombre,
      filter: 'text',
      filterPlaceholder: 'Cliente',
      width: '12rem',
    },
    {
      key: 'tareaDescripcion',
      header: 'Tarea',
      value: (registro) => registro.tareaDescripcion,
      filter: 'text',
      filterPlaceholder: 'Descripción de tarea',
      width: '16rem',
    },
    {
      key: 'proceso',
      header: 'Proceso',
      value: (registro) => registro.proceso,
      display: (registro) => PROCESO_LABEL[registro.proceso],
      kind: 'badge',
      tone: toneProceso,
      filter: 'select',
      filterOptions: PROCESO_OPTIONS,
      width: '8.5rem',
    },
    {
      key: 'participantes',
      header: 'Participantes',
      value: (registro) => registro.participantes,
      filter: 'text',
      filterPlaceholder: 'Empleado',
      width: '16rem',
    },
    {
      key: 'publicado',
      header: 'Publicado',
      value: (registro) => String(registro.publicado),
      display: (registro) => (registro.publicado ? 'Sí' : 'No'),
      kind: 'badge',
      tone: tonePublicado,
      filter: 'select',
      filterOptions: PUBLICADO_OPTIONS,
      width: '7.5rem',
    },
  ];
}
