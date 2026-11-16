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
import type { Empleado, EmpleadoCreacion, EmpleadoModificacion } from '../../../panel.model';

type EstadoEnvio = 'inicial' | 'enviando' | 'error';

/** Modelo editable del formulario; el DNI se edita como texto y se envía como número. */
interface ModeloEmpleado {
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  contrasenia: string;
}

const MODELO_VACIO: ModeloEmpleado = {
  nombre: '',
  email: '',
  telefono: '',
  dni: '',
  contrasenia: '',
};

type CampoEmpleado = keyof ModeloEmpleado;

/**
 * Formulario de alta y modificación de empleados.
 *
 * Con `empleado = null` crea un empleado nuevo (incluye contraseña); con uno
 * existente modifica sus datos sin tocar la contraseña, tal como espera el
 * endpoint `PUT /api/empleados/{legajo}`.
 */
@Component({
  selector: 'app-form-empleado',
  imports: [FormField],
  templateUrl: './form-empleado.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEmpleado {
  /** Empleado a modificar; `null` para dar de alta uno nuevo. */
  readonly empleado = input<Empleado | null>(null);
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');
  protected readonly creando = computed(() => this.empleado() === null);

  private readonly modelo = signal<ModeloEmpleado>({ ...MODELO_VACIO });

  readonly formulario = form(this.modelo, (campos) => {
    required(campos.nombre, { message: 'Ingresa el nombre del empleado.' });
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
    // que no la incluye (`PUT /api/empleados/{legajo}`).
    required(campos.contrasenia, { message: 'Crea una contraseña.', when: () => this.creando() });
    minLength(campos.contrasenia, 8, {
      message: 'La contraseña debe tener al menos 8 caracteres.',
      when: () => this.creando(),
    });
  });

  constructor() {
    // Al abrir el modal se reinicia el modelo con los datos de la fila (o vacío).
    effect(() => {
      const empleado = this.empleado();
      this.modelo.set(
        empleado === null
          ? { ...MODELO_VACIO }
          : {
              nombre: empleado.nombre,
              email: empleado.email,
              telefono: empleado.telefono,
              dni: String(empleado.dni),
              contrasenia: '',
            },
      );
      this.estadoEnvio.set('inicial');
    });
  }

  protected campoConError(campo: CampoEmpleado): boolean {
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
      const empleado = this.empleado();

      if (empleado === null) {
        const nuevo: EmpleadoCreacion = {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          dni,
          contrasenia: datos.contrasenia,
        };

        await this.data.crearEmpleado(nuevo);
      } else {
        const cambios: EmpleadoModificacion = {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          dni,
          legajo: empleado.legajo,
          historial: empleado.historial,
        };

        await this.data.modificarEmpleado(empleado.legajo, cambios);
      }

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
