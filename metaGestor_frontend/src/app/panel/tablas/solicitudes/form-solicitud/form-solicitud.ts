import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { email, form, FormField, minLength, pattern, required } from '@angular/forms/signals';
import { PanelData } from '../../../panel-data/panel-data';
import type { Solicitud } from '../../../panel.model';

type EstadoEnvio = 'inicial' | 'enviando' | 'error';

/** Modelo editable del formulario de solicitudes. */
interface ModeloSolicitud {
  nombre: string;
  email: string;
  telefono: string;
  descripcion: string;
  atendido: boolean;
}

const MODELO_VACIO: ModeloSolicitud = {
  nombre: '',
  email: '',
  telefono: '',
  descripcion: '',
  atendido: false,
};

type CampoSolicitud = keyof ModeloSolicitud;

export interface DatosSolicitudInicial {
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string;
  readonly descripcion?: string;
}

/**
 * Formulario de creación y modificación de solicitudes.
 *
 * Con `solicitud` se edita una solicitud existente (`PUT /api/solicitudes/{id}`).
 * Sin `solicitud` se crea una nueva (`POST /api/solicitudes/crear`), usando
 * `datosIniciales` para precargar los datos del solicitante.
 */
@Component({
  selector: 'app-form-solicitud',
  imports: [FormField],
  templateUrl: './form-solicitud.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSolicitud {
  /** Solicitud a modificar; `null` para crear una nueva. */
  readonly solicitud = input<Solicitud | null>(null);
  /** Valores iniciales al crear una solicitud (p. ej. datos del cliente). */
  readonly datosIniciales = input<DatosSolicitudInicial | null>(null);
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');
  protected readonly creando = signal(true);

  private readonly modelo = signal<ModeloSolicitud>({ ...MODELO_VACIO });

  readonly formulario = form(this.modelo, (campos) => {
    required(campos.nombre, { message: 'Ingresa el nombre del solicitante.' });
    minLength(campos.nombre, 2, { message: 'El nombre debe tener al menos 2 caracteres.' });

    required(campos.email, { message: 'Ingresa el correo electrónico.' });
    email(campos.email, { message: 'Ingresa un correo electrónico válido.' });

    required(campos.telefono, { message: 'Ingresa el teléfono.' });
    pattern(campos.telefono, /^\d{7,11}$/, {
      message: 'El teléfono debe tener entre 7 y 11 dígitos.',
    });

    required(campos.descripcion, { message: 'Ingresa la descripción del requerimiento.' });
    minLength(campos.descripcion, 10, {
      message: 'Describe brevemente el requerimiento (mínimo 10 caracteres).',
    });
  });

  constructor() {
    // Al abrir el modal se reinicia el modelo con los datos de la solicitud o con los iniciales.
    effect(() => {
      const solicitud = this.solicitud();
      const iniciales = this.datosIniciales();

      if (solicitud) {
        this.creando.set(false);
        this.modelo.set({
          nombre: solicitud.nombre,
          email: solicitud.email,
          telefono: solicitud.telefono,
          descripcion: solicitud.descripcion,
          atendido: solicitud.atendido ?? false,
        });
      } else {
        this.creando.set(true);
        this.modelo.set({
          nombre: iniciales?.nombre ?? '',
          email: iniciales?.email ?? '',
          telefono: iniciales?.telefono ?? '',
          descripcion: iniciales?.descripcion ?? '',
          atendido: false,
        });
      }

      this.estadoEnvio.set('inicial');
    });
  }

  protected actualizarAtendido(evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this.modelo.update((actual) => ({ ...actual, atendido: marcado }));
  }

  protected campoConError(campo: CampoSolicitud): boolean {
    const estado = this.formulario[campo]();
    return estado.invalid() && estado.touched();
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

    this.estadoEnvio.set('enviando');

    const datos = this.modelo();
    const solicitud = this.solicitud();

    try {
      if (solicitud) {
        await this.data.modificarSolicitud(solicitud.id, {
          id: solicitud.id,
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          descripcion: datos.descripcion,
          atendido: datos.atendido,
        });
      } else {
        await this.data.crearSolicitud({
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          descripcion: datos.descripcion,
          atendido: false,
        });
      }

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
