import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { PanelData } from '../../../panel-data/panel-data';
import {
  PROCESO_LABEL,
  type ProcesoRegistro,
  type Registro,
  type RegistroEscritura,
} from '../../../panel.model';

type EstadoEnvio = 'inicial' | 'enviando' | 'error';

/**
 * Modelo editable del formulario. Los IDs de tarea y cliente se editan como
 * texto (el valor de un `<select>`) y se convierten a número al enviar.
 */
interface ModeloRegistro {
  titulo: string;
  tareaId: string;
  clienteId: string;
  proceso: ProcesoRegistro | '';
  publicado: boolean;
}

const MODELO_VACIO: ModeloRegistro = {
  titulo: '',
  tareaId: '',
  clienteId: '',
  proceso: '',
  publicado: false,
};

type CampoRegistro = keyof ModeloRegistro;

/**
 * Formulario de alta y modificación de registros de trabajo.
 *
 * Envía el payload `CrearRegistroDTO` tanto al crear (`POST /api/registros`)
 * como al modificar (`PUT /api/registros/{id}`).
 */
@Component({
  selector: 'app-form-registro',
  imports: [FormField],
  templateUrl: './form-registro.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRegistro {
  /** Registro a modificar; `null` para crear uno nuevo. */
  readonly registro = input<Registro | null>(null);
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  /** Colecciones que alimentan los selects de tarea, cliente y participantes. */
  protected readonly tareas = this.data.tareas;
  protected readonly clientes = this.data.clientes;
  protected readonly empleados = this.data.empleados;

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');
  protected readonly creando = computed(() => this.registro() === null);
  /** Marca el error de la lista de participantes cuando se envía vacía. */
  protected readonly errorParticipantes = signal(false);

  /**
   * Participantes elegidos por legajo. Los formularios de señales no admiten
   * un grupo de casillas enlazado a un arreglo, así que se controlan con esta
   * señal aparte y se validan al enviar.
   */
  protected readonly participantes = signal<readonly number[]>([]);

  private readonly modelo = signal<ModeloRegistro>({ ...MODELO_VACIO });

  readonly formulario = form(this.modelo, (campos) => {
    required(campos.titulo, { message: 'Ingresa el título del registro.' });
    required(campos.tareaId, { message: 'Selecciona la tarea.' });
    required(campos.clienteId, { message: 'Selecciona el cliente.' });
    required(campos.proceso, { message: 'Selecciona el estado del proceso.' });
  });

  constructor() {
    // Al abrir el modal se reinicia el modelo con los datos de la fila (o vacío).
    effect(() => {
      const registro = this.registro();
      this.modelo.set(
        registro === null
          ? { ...MODELO_VACIO }
          : {
              titulo: registro.titulo,
              tareaId: String(registro.tareaId),
              clienteId: String(registro.clienteId),
              proceso: registro.proceso,
              publicado: registro.publicado,
            },
      );
      this.participantes.set(registro === null ? [] : [...registro.participantesId]);
      this.errorParticipantes.set(false);
      this.estadoEnvio.set('inicial');
    });
  }

  protected readonly procesos = Object.entries(PROCESO_LABEL) as readonly [
    ProcesoRegistro,
    string,
  ][];

  protected campoConError(campo: CampoRegistro): boolean {
    const estado = this.formulario[campo]();
    return estado.invalid() && estado.touched();
  }

  protected participa(legajo: number): boolean {
    return this.participantes().includes(legajo);
  }

  protected alternarParticipante(legajo: number, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this.participantes.update((actuales) =>
      marcado ? [...actuales, legajo] : actuales.filter((actual) => actual !== legajo),
    );
    this.errorParticipantes.set(false);
  }

  protected async enviar(evento: Event): Promise<void> {
    evento.preventDefault();

    // Evita envíos duplicados por doble clic o Enter repetido.
    if (this.estadoEnvio() === 'enviando') {
      return;
    }

    // No envía si el formulario tiene errores; muestra los mensajes.
    if (this.formulario().invalid()) {
      this.formulario().markAsTouched();
      return;
    }

    // El backend exige al menos un participante en el registro.
    if (this.participantes().length === 0) {
      this.errorParticipantes.set(true);
      return;
    }

    this.estadoEnvio.set('enviando');

    const datos = this.modelo();
    const payload: RegistroEscritura = {
      titulo: datos.titulo,
      tareaId: Number(datos.tareaId),
      clienteId: Number(datos.clienteId),
      proceso: datos.proceso as ProcesoRegistro,
      participantesId: this.participantes(),
      publicado: datos.publicado,
    };

    try {
      const registro = this.registro();

      if (registro === null) {
        await this.data.crearRegistro(payload);
      } else {
        await this.data.modificarRegistro(registro.id, payload);
      }

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
