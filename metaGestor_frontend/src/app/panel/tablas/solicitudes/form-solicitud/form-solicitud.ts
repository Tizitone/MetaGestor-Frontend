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
}

const MODELO_VACIO: ModeloSolicitud = {
  nombre: '',
  email: '',
  telefono: '',
  descripcion: '',
};

type CampoSolicitud = keyof ModeloSolicitud;

/**
 * Formulario de modificación de solicitudes.
 *
 * Las solicitudes nacen del formulario de contacto del sitio público, así
 * que el panel solo permite editarlas o eliminarlas (`PUT /api/solicitudes/{id}`).
 */
@Component({
  selector: 'app-form-solicitud',
  imports: [FormField],
  templateUrl: './form-solicitud.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSolicitud {
  /** Solicitud a modificar. */
  readonly solicitud = input.required<Solicitud>();
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');

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
    // Al abrir el modal se reinicia el modelo con los datos de la fila.
    effect(() => {
      const solicitud = this.solicitud();
      this.modelo.set({
        nombre: solicitud.nombre,
        email: solicitud.email,
        telefono: solicitud.telefono,
        descripcion: solicitud.descripcion,
      });
      this.estadoEnvio.set('inicial');
    });
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

    try {
      await this.data.modificarSolicitud(this.solicitud().id, {
        id: this.solicitud().id,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        descripcion: datos.descripcion,
      });

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
