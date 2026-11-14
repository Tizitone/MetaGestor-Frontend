import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PanelData } from '../../../panel-data/panel-data';
import {
  CATEGORIA_LABEL,
  PROCESO_LABEL,
  type CategoriaTarea,
  type ProcesoRegistro,
  type Registro,
  type RegistroEscritura,
  type Tarea,
} from '../../../panel.model';

/** Registro ligado a una tarea, enriquecido con los nombres que referencia por ID. */
interface RegistroEmpleado extends Registro {
  readonly clienteNombre: string;
  readonly participantes: string;
}

/** Tarea del historial del empleado junto con los registros que la referencian. */
interface TareaAsignada {
  readonly tarea: Tarea;
  readonly registros: readonly RegistroEmpleado[];
}

/** Mismo criterio de colores que la tabla de Registros. */
type TonoBadge = 'success' | 'info' | 'warning' | 'neutral';

function tonoProceso(proceso: ProcesoRegistro): TonoBadge {
  switch (proceso) {
    case 'TERMINADO':
      return 'success';
    case 'ENPROCESO':
      return 'info';
    default:
      return 'warning';
  }
}

function tonoCategoria(categoria: CategoriaTarea): TonoBadge {
  switch (categoria) {
    case 'PESADO':
      return 'warning';
    case 'MEDIANO':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Orden de avance del proceso; `null` cuando el registro ya está terminado. */
const SIGUIENTE_PROCESO: Readonly<Record<ProcesoRegistro, ProcesoRegistro | null>> = {
  ESPERA: 'ENPROCESO',
  ENPROCESO: 'TERMINADO',
  TERMINADO: null,
};

/**
 * Perfil de un empleado.
 *
 * Muestra sus datos, las tareas registradas en su historial y los registros de
 * trabajo ligados a esas tareas, permitiendo avanzar su estado de proceso.
 */
@Component({
  selector: 'app-perfil-empleado',
  imports: [RouterLink],
  templateUrl: './perfil-empleado.html',
  styleUrls: ['../../page.css', './perfil-empleado.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilEmpleado {
  private readonly data = inject(PanelData);

  readonly legajo = input.required<number, string>({
    transform: numberAttribute,
  });

  protected readonly categoriaLabel = CATEGORIA_LABEL;
  protected readonly procesoLabel = PROCESO_LABEL;
  protected readonly siguienteProceso = SIGUIENTE_PROCESO;
  protected readonly tonoProceso = tonoProceso;
  protected readonly tonoCategoria = tonoCategoria;

  /**
   * `empleados/{legajo}` no está disponible en el backend, así que el empleado
   * se resuelve desde la colección que ya carga el panel.
   */
  protected readonly empleado = computed(
    () => this.data.empleados().find((actual) => actual.legajo === this.legajo()) ?? null,
  );

  /** Tareas del historial con los registros cuyo `tareaId` las referencia. */
  protected readonly tareasAsignadas = computed<readonly TareaAsignada[]>(() => {
    const empleado = this.empleado();
    if (!empleado) {
      return [];
    }

    const registros = this.data.registros();

    return empleado.historial.map((tarea) => ({
      tarea,
      registros: registros
        .filter((registro) => registro.tareaId === tarea.idTarea)
        .map((registro) => ({
          ...registro,
          clienteNombre: this.data.nombreDeCliente(registro.clienteId),
          participantes:
            registro.participantesId
              .map((legajo) => this.data.nombreDeEmpleado(legajo))
              .join(', ') || 'Sin participantes',
        })),
    }));
  });

  /** Registro cuyo estado se está enviando; bloquea el resto de acciones. */
  protected readonly registroActualizando = signal<number | null>(null);
  protected readonly errorAccion = signal('');

  protected nombreDeTarea(tarea: Tarea): string {
    return tarea.titulo || tarea.descripcionGeneral || `Tarea #${tarea.idTarea}`;
  }

  protected async avanzar(registro: RegistroEmpleado): Promise<void> {
    const siguiente = SIGUIENTE_PROCESO[registro.proceso];

    if (!siguiente || this.registroActualizando() !== null) {
      return;
    }

    this.errorAccion.set('');
    this.registroActualizando.set(registro.id);

    const payload: RegistroEscritura = {
      titulo: registro.titulo,
      tareaId: registro.tareaId,
      clienteId: registro.clienteId,
      proceso: siguiente,
      participantesId: registro.participantesId,
      publicado: registro.publicado,
    };

    try {
      await this.data.modificarRegistro(registro.id, payload);
    } catch {
      this.errorAccion.set('No se pudo actualizar el estado del registro. Intenta nuevamente.');
    } finally {
      this.registroActualizando.set(null);
    }
  }
}
