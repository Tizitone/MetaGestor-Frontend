import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDate } from '../../../extras/format';
import { PanelData } from '../../../panel-data/panel-data';
import {
  CATEGORIA_EMPLEADO_LABEL,
  CATEGORIA_LABEL,
  PROCESO_LABEL,
  type CategoriaEmpleado,
  type ProcesoRegistro,
  type Registro,
  type Tarea,
} from '../../../panel.model';

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

/** Mismo criterio de colores que la tabla de Empleados. */
function tonoCategoriaEmpleado(categoria: CategoriaEmpleado): TonoBadge {
  switch (categoria) {
    case 'TORNERO':
      return 'info';
    case 'SOLDADOR':
      return 'warning';
    case 'CORTADOR':
      return 'success';
    default:
      return 'neutral';
  }
}

/**
 * Perfil de un empleado.
 *
 * Muestra sus datos, las tareas de su historial y los registros vinculados a
 * esas tareas. El único cambio que puede hacer el empleado es el estado
 * (`proceso`) de esos registros.
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
  protected readonly categoriaEmpleadoLabel = CATEGORIA_EMPLEADO_LABEL;
  protected readonly procesoLabel = PROCESO_LABEL;
  protected readonly procesos = Object.keys(PROCESO_LABEL) as readonly ProcesoRegistro[];
  protected readonly tonoProceso = tonoProceso;
  protected readonly tonoCategoriaEmpleado = tonoCategoriaEmpleado;

  /** Los empleados vuelven a sus tareas; los roles de gestión, a la tabla. */
  protected readonly esEmpleado = this.data.esEmpleado;

  constructor() {
    // Sincroniza el legajo de la ruta con PanelData para consultar el detalle.
    effect(() => {
      this.data.legajoActual.set(this.legajo());
    });
  }

  protected readonly empleado = computed(() => this.data.buscarEmpleado(this.legajo()));

  protected readonly tareas = computed<readonly Tarea[]>(
    () => this.empleado()?.historial ?? [],
  );

  /** Registros cuya tarea pertenece al historial del empleado. */
  protected readonly registros = computed<readonly Registro[]>(() => {
    const tareasAsignadas = new Set(this.tareas().map((tarea) => tarea.idTarea));

    return this.data
      .registros()
      .filter((registro) => tareasAsignadas.has(registro.tareaId));
  });

  // --- Edición del estado de un registro ---

  /** Estado elegido por registro, antes de pulsar «Guardar estado». */
  private readonly seleccion = signal<Readonly<Record<number, ProcesoRegistro>>>({});
  protected readonly guardando = signal<number | null>(null);
  protected readonly aviso = signal('');
  protected readonly error = signal('');

  protected resumenTarea(idTarea: number): string {
    const tarea = this.tareas().find((actual) => actual.idTarea === idTarea);
    return tarea?.titulo || tarea?.descripcionGeneral || `Tarea #${idTarea}`;
  }

  protected fechaEntrega(tarea: Tarea): string {
    return formatDate(tarea.fechaDeEntrega);
  }

  protected procesoDe(registro: Registro): ProcesoRegistro {
    return this.seleccion()[registro.id] ?? registro.proceso;
  }

  protected seleccionar(registro: Registro, evento: Event): void {
    const proceso = (evento.target as HTMLSelectElement).value as ProcesoRegistro;

    this.seleccion.update((actual) => ({ ...actual, [registro.id]: proceso }));
    this.aviso.set('');
    this.error.set('');
  }

  protected async guardar(registro: Registro): Promise<void> {
    const proceso = this.procesoDe(registro);

    if (proceso === registro.proceso || this.guardando() !== null) {
      return;
    }

    this.guardando.set(registro.id);
    this.aviso.set('');
    this.error.set('');

    try {
      // El backend reemplaza el registro completo: se reenvían sus datos y
      // solo cambia el proceso. La lista de participantes va vacía para que el
      // backend conserve los actuales (algunos registros referencian legajos
      // históricos que ya no existen y no deben bloquear el cambio de estado).
      await this.data.modificarRegistro(registro.id, {
        titulo: registro.titulo,
        tareaId: registro.tareaId,
        clienteId: registro.clienteId,
        proceso,
        participantesId: [],
        publicado: registro.publicado,
      });

      this.seleccion.update((actual) => {
        const copia = { ...actual };
        delete copia[registro.id];
        return copia;
      });
      this.aviso.set(`Estado del registro #${registro.id} actualizado.`);
    } catch {
      this.error.set(
        `No se pudo actualizar el estado del registro #${registro.id}. Intenta nuevamente.`,
      );
    } finally {
      this.guardando.set(null);
    }
  }
}
