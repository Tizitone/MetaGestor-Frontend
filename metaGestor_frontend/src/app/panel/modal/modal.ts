import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

let nextModalId = 0;

/**
 * Contenedor de diálogo modal.
 *
 * Se instancia desde la plantilla de la página (idealmente dentro de un
 * `@if`) y proyecta su contenido en el cuerpo del diálogo. El fondo, la
 * tecla Escape y el botón de cierre emiten `cerrar`; la decisión de qué
 * hacer con ello (normalmente ocultar el modal) queda en la página.
 */
@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly cerrar = output<void>();

  /** Identificador único del título, para vincularlo con `aria-labelledby`. */
  protected readonly idTitulo = `modal-titulo-${nextModalId++}`;

  private readonly dialogo = viewChild.required<ElementRef<HTMLElement>>('dialogo');

  constructor() {
    // Lleva el foco al diálogo apenas se renderiza para navegar con teclado.
    afterNextRender(() => this.dialogo().nativeElement.focus());
  }
}
