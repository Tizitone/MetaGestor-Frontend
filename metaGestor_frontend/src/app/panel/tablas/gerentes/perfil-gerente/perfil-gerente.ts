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
import { PanelData } from '../../../panel-data/panel-data';
import { PROCESO_LABEL, type ProcesoRegistro, type Registro } from '../../../panel.model';

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

/**
 * Perfil de un gerente.
 *
 * Reutiliza la estructura visual del perfil de empleado: datos personales y
 * los registros en los que participa. Como el empleado, el gerente puede
 * actualizar el estado de esos registros desde la ficha.
 */
@Component({
  selector: 'app-perfil-gerente',
  imports: [RouterLink],
  templateUrl: './perfil-gerente.html',
  styleUrls: ['../../page.css', './perfil-gerente.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilGerente {
  private readonly data = inject(PanelData);

  readonly legajo = input.required<number, string>({
    transform: numberAttribute,
  });

  protected readonly procesoLabel = PROCESO_LABEL;
  protected readonly procesos = Object.keys(PROCESO_LABEL) as readonly ProcesoRegistro[];
  protected readonly tonoProceso = tonoProceso;

  constructor() {
    // Sincroniza el legajo de la ruta con PanelData para consultar el detalle.
    effect(() => {
      this.data.gerenteActual.set(this.legajo());
    });
  }

  protected readonly gerente = computed(() => this.data.buscarGerente(this.legajo()));

  /** `true` mientras el endpoint de gerentes todavía no respondió. */
  protected readonly cargando = computed(() => this.gerente() === undefined);

  /** Registros en los que el gerente figura como participante. */
  protected readonly registros = computed<readonly Registro[]>(() => {
    const legajo = this.legajo();

    return this.data
      .registros()
      .filter((registro) => registro.participantesId.includes(legajo));
  });

  protected resumenTarea(idTarea: number): string {
    return this.data.resumenDeTarea(idTarea);
  }

  // --- Edición del estado de un registro ---

  /** Estado elegido por registro, antes de pulsar «Guardar estado». */
  private readonly seleccion = signal<Readonly<Record<number, ProcesoRegistro>>>({});
  protected readonly guardando = signal<number | null>(null);
  protected readonly aviso = signal('');
  protected readonly error = signal('');

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
      // backend conserve los actuales.
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
