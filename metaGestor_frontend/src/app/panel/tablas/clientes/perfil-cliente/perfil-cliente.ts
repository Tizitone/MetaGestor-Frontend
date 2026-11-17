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
import { Modal } from '../../../modal/modal';
import { PanelData } from '../../../panel-data/panel-data';
import { PROCESO_LABEL, type ProcesoRegistro, type Registro } from '../../../panel.model';
import {
  FormSolicitud,
  type DatosSolicitudInicial,
} from '../../solicitudes/form-solicitud/form-solicitud';

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
  imports: [FormSolicitud, Modal, RouterLink],
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

  /**
   * Solo el propio cliente puede hacer un pedido desde su ficha. El
   * administrador y el gerente consultan el perfil, pero no crean solicitudes.
   */
  protected readonly esCliente = this.data.esCliente;

  protected readonly pedidoAbierto = signal(false);

  constructor() {
    // Sincronizamos el input de la ruta con el servicio cada vez que cambie
    effect(() => {
      this.data.idActual.set(this.idCliente());
    });
  }

  // Ahora el servicio buscará automáticamente el cliente correcto gracias a idActual
  protected readonly cliente = computed(() => this.data.buscarCliente());

  protected readonly datosPedido = computed<DatosSolicitudInicial | null>(() => {
    const cliente = this.cliente();
    if (!cliente) {
      return null;
    }

    return {
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      descripcion: '',
    };
  });

  protected abrirPedido(): void {
    this.pedidoAbierto.set(true);
  }

  protected cerrarPedido(): void {
    this.pedidoAbierto.set(false);
  }

  // Y podemos usar la lista de registros que el servicio ya filtra por cliente,
  // mapeando sus nombres tal como lo estabas haciendo:
  protected readonly registros = computed<readonly RegistroCliente[]>(() =>
    this.data
      .buscarRegistrosCliente() // Usamos la señal optimizada del servicio
      .map((registro) => ({
        ...registro,
        tareaDescripcion: this.data.resumenDeTareaDeRegistro(registro),
        participantes:
          registro.participantesId.map((legajo) => this.data.nombreDeEmpleado(legajo)).join(', ') ||
          'Sin participantes',
      })),
  );
}