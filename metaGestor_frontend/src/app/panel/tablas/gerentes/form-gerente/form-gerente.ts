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
import type {
  Gerente,
  GerenteCreacion,
  GerenteModificacion,
} from '../../../panel.model';

type EstadoEnvio = 'inicial' | 'enviando' | 'error';

/** Modelo editable del formulario; el DNI se edita como texto y se envía como número. */
interface ModeloGerente {
  nombre: string;
  email: string;
  telefono: string;
  dni: string;
  contrasenia: string;
}

const MODELO_VACIO: ModeloGerente = {
  nombre: '',
  email: '',
  telefono: '',
  dni: '',
  contrasenia: '',
};

type CampoGerente = keyof ModeloGerente;

/**
 * Formulario de alta y modificación de gerentes.
 *
 * Con `gerente = null` crea un gerente nuevo (incluye contraseña); con uno
 * existente modifica sus datos sin tocar la contraseña, tal como espera el
 * endpoint `PUT /api/gerentes/{legajo}`.
 */
@Component({
  selector: 'app-form-gerente',
  imports: [FormField],
  templateUrl: './form-gerente.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormGerente {
  /** Gerente a modificar; `null` para dar de alta uno nuevo. */
  readonly gerente = input<Gerente | null>(null);
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');
  protected readonly creando = computed(() => this.gerente() === null);

  private readonly modelo = signal<ModeloGerente>({ ...MODELO_VACIO });

  readonly formulario = form(this.modelo, (campos) => {
    required(campos.nombre, { message: 'Ingresa el nombre del gerente.' });
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
    // que no la incluye (`PUT /api/gerentes/{legajo}`).
    required(campos.contrasenia, { message: 'Crea una contraseña.', when: () => this.creando() });
    minLength(campos.contrasenia, 8, {
      message: 'La contraseña debe tener al menos 8 caracteres.',
      when: () => this.creando(),
    });
  });

  constructor() {
    // Al abrir el modal se reinicia el modelo con los datos de la fila (o vacío).
    effect(() => {
      const gerente = this.gerente();
      this.modelo.set(
        gerente === null
          ? { ...MODELO_VACIO }
          : {
              nombre: gerente.nombre,
              email: gerente.email,
              telefono: gerente.telefono,
              dni: String(gerente.dni),
              contrasenia: '',
            },
      );
      this.estadoEnvio.set('inicial');
    });
  }

  protected campoConError(campo: CampoGerente): boolean {
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
      const gerente = this.gerente();

      if (gerente === null) {
        const nuevo: GerenteCreacion = {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          dni,
          contrasenia: datos.contrasenia,
        };

        await this.data.crearGerente(nuevo);
      } else {
        const cambios: GerenteModificacion = {
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          dni,
          legajo: gerente.legajo,
        };

        await this.data.modificarGerente(gerente.legajo, cambios);
      }

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
