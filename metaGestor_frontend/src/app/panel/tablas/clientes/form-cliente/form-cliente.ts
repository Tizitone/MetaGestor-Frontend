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
import { email, form, FormField, minLength, pattern, required } from '@angular/forms/signals';
import { PanelData } from '../../../panel-data/panel-data';
import type { Cliente } from '../../../panel.model';

type EstadoEnvio = 'inicial' | 'enviando' | 'error';

/** Modelo editable del formulario; el DNI se edita como texto y se envía como número. */
interface ModeloCliente {
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  contrasenia: string;
}

const MODELO_VACIO: ModeloCliente = {
  nombre: '',
  email: '',
  telefono: '',
  dni: '',
  contrasenia: '',
};

type CampoCliente = keyof ModeloCliente;

/**
 * Formulario de alta y modificación de clientes.
 *
 * Con `cliente = null` crea un cliente nuevo (incluye contraseña); con un
 * cliente existente modifica sus datos sin tocar la contraseña, tal como
 * espera el endpoint `PUT /api/clientes/{id}`.
 */
@Component({
  selector: 'app-form-cliente',
  imports: [FormField],
  templateUrl: './form-cliente.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCliente {
  /** Cliente a modificar; `null` para dar de alta uno nuevo. */
  readonly cliente = input<Cliente | null>(null);
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');
  protected readonly creando = computed(() => this.cliente() === null);

  private readonly modelo = signal<ModeloCliente>({ ...MODELO_VACIO });

  readonly formulario = form(this.modelo, (campos) => {
    required(campos.nombre, { message: 'Ingresa el nombre del cliente.' });
    minLength(campos.nombre, 3, { message: 'El nombre debe tener al menos 3 caracteres.' });

    required(campos.email, { message: 'Ingresa el correo electrónico.' });
    email(campos.email, { message: 'Ingresa un correo electrónico válido.' });

    required(campos.telefono, { message: 'Ingresa el teléfono.' });
    pattern(campos.telefono, /^\d{7,11}$/, {
      message: 'El teléfono debe tener entre 7 y 11 dígitos.',
    });

    required(campos.dni, { message: 'Ingresa el DNI.' });
    pattern(campos.dni, /^\d{7,8}$/, { message: 'El DNI debe tener 7 u 8 dígitos.' });

    // La contraseña solo se pide al crear: la modificación usa el endpoint
    // que no la incluye (`PUT /api/clientes/{id}`).
    required(campos.contrasenia, { message: 'Crea una contraseña.', when: () => this.creando() });
    minLength(campos.contrasenia, 8, {
      message: 'La contraseña debe tener al menos 8 caracteres.',
      when: () => this.creando(),
    });
  });

  constructor() {
    // Al abrir el modal se reinicia el modelo con los datos de la fila (o vacío).
    effect(() => {
      const cliente = this.cliente();
      this.modelo.set(
        cliente === null
          ? { ...MODELO_VACIO }
          : {
              nombre: cliente.nombre,
              email: cliente.email,
              telefono: cliente.telefono,
              dni: String(cliente.dni),
              contrasenia: '',
            },
      );
      this.estadoEnvio.set('inicial');
    });
  }

  protected campoConError(campo: CampoCliente): boolean {
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
    const dni = Number(datos.dni);

    try {
      const cliente = this.cliente();

      if (cliente === null) {
        await this.data.crearCliente({
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          dni,
          contrasenia: datos.contrasenia,
        });
      } else {
        await this.data.modificarCliente(cliente.idCliente, {
          idCliente: cliente.idCliente,
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          dni,
        });
      }

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
