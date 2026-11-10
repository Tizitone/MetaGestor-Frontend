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
import { form, FormField, pattern, required } from '@angular/forms/signals';
import { PanelData } from '../../../panel-data/panel-data';
import { CATEGORIA_LABEL, type CategoriaTarea, type Tarea, type TareaEscritura } from '../../../panel.model';

type EstadoEnvio = 'inicial' | 'enviando' | 'error';

/** Modelo editable del formulario; la cantidad se edita como texto y se envía como número. */
interface ModeloTarea {
  titulo: string;
  categorias: CategoriaTarea | '';
  fechaDeEntrega: string;
  descripcionMaterial: string;
  descripcionGeneral: string;
  cantidad: string;
}

const MODELO_VACIO: ModeloTarea = {
  titulo: '',
  categorias: '',
  fechaDeEntrega: '',
  descripcionMaterial: '',
  descripcionGeneral: '',
  cantidad: '',
};

type CampoTarea = keyof ModeloTarea;

/**
 * Formulario de alta y modificación de tareas.
 *
 * Envía el payload `CrearTareaDTO` tanto al crear (`POST /api/tareas`) como
 * al modificar (`PUT /api/tareas/{id}`).
 */
@Component({
  selector: 'app-form-tarea',
  imports: [FormField],
  templateUrl: './form-tarea.html',
  styleUrl: '../../form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTarea {
  /** Tarea a modificar; `null` para crear una nueva. */
  readonly tarea = input<Tarea | null>(null);
  readonly cancelar = output<void>();
  readonly guardado = output<void>();

  private readonly data = inject(PanelData);

  protected readonly estadoEnvio = signal<EstadoEnvio>('inicial');
  protected readonly creando = computed(() => this.tarea() === null);

  /** Opciones de categoría con su etiqueta legible. */
  protected readonly categorias = Object.entries(CATEGORIA_LABEL) as readonly [
    CategoriaTarea,
    string,
  ][];

  private readonly modelo = signal<ModeloTarea>({ ...MODELO_VACIO });

  readonly formulario = form(this.modelo, (campos) => {
    required(campos.titulo, { message: 'Ingresa el título de la tarea.' });

    required(campos.categorias, { message: 'Selecciona una categoría.' });

    required(campos.fechaDeEntrega, { message: 'Selecciona la fecha de entrega.' });

    required(campos.descripcionGeneral, { message: 'Ingresa la descripción general.' });

    required(campos.cantidad, { message: 'Ingresa la cantidad.' });
    pattern(campos.cantidad, /^[1-9]\d*$/, {
      message: 'La cantidad debe ser un número entero mayor que cero.',
    });
  });

  constructor() {
    // Al abrir el modal se reinicia el modelo con los datos de la fila (o vacío).
    effect(() => {
      const tarea = this.tarea();
      this.modelo.set(
        tarea === null
          ? { ...MODELO_VACIO }
          : {
              titulo: tarea.titulo,
              categorias: tarea.categorias,
              fechaDeEntrega: tarea.fechaDeEntrega,
              descripcionMaterial: tarea.descripcionMaterial,
              descripcionGeneral: tarea.descripcionGeneral,
              cantidad: String(tarea.cantidad),
            },
      );
      this.estadoEnvio.set('inicial');
    });
  }

  protected campoConError(campo: CampoTarea): boolean {
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
    const payload: TareaEscritura = {
      titulo: datos.titulo,
      categorias: datos.categorias as CategoriaTarea,
      fechaDeEntrega: datos.fechaDeEntrega,
      descripcionMaterial: datos.descripcionMaterial,
      descripcionGeneral: datos.descripcionGeneral,
      cant: Number(datos.cantidad),
    };

    try {
      const tarea = this.tarea();

      if (tarea === null) {
        await this.data.crearTarea(payload);
      } else {
        await this.data.modificarTarea(tarea.idTarea, payload);
      }

      this.guardado.emit();
    } catch {
      this.estadoEnvio.set('error');
    }
  }
}
