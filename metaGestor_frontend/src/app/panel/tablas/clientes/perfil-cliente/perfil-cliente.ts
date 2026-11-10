import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PanelData } from '../../../panel-data/panel-data';
import { PROCESO_LABEL, type ProcesoRegistro, type Registro } from '../../../panel.model';

/** Registro del cliente enriquecido con los nombres que referencia por ID. */
interface RegistroCliente extends Registro {
  readonly tareaDescripcion: string;
  readonly participantes: string;
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

function tonoPublicado(publicado: boolean): TonoBadge {
  return publicado ? 'success' : 'neutral';
}

@Component({
  selector: 'app-perfil-cliente',
  imports: [RouterLink],
  templateUrl: './perfil-cliente.html',
  styleUrls: ['../../page.css', './perfil-cliente.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilCliente {
private readonly data = inject(PanelData);

  readonly idCliente = input.required<number, string>({
    transform: numberAttribute,
  });

  protected readonly procesoLabel = PROCESO_LABEL;

  protected readonly tonoProceso = tonoProceso;

  protected readonly tonoPublicado = tonoPublicado;

  

  constructor() {
    // Sincronizamos el input de la ruta con el servicio cada vez que cambie
    effect(() => {
      this.data.idActual.set(this.idCliente());
    });
  }

  // Ahora el servicio buscará automáticamente el cliente correcto gracias a idActual
  protected readonly cliente = computed(() => this.data.buscarCliente());

  // Y podemos usar la lista de registros que el servicio ya filtra por cliente,
  // mapeando sus nombres tal como lo estabas haciendo:
  protected readonly registros = computed<readonly RegistroCliente[]>(() =>
    this.data
      .buscarRegistrosCliente() // Usamos la señal optimizada del servicio
      .map((registro) => ({
        ...registro,
        tareaDescripcion: this.data.resumenDeTarea(registro.tareaId),
        participantes:
          registro.participantesId.map((legajo) => this.data.nombreDeEmpleado(legajo)).join(', ') ||
          'Sin participantes',
      })),
  );
}