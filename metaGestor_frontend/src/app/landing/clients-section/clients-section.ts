import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';

interface ClientTestimonial {
  readonly project: string;
  readonly testimonial: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
  readonly color: string;
}

interface DragState {
  readonly pointerId: number;
  readonly startX: number;
  startScrollLeft: number;
  lastX: number;
  lastTime: number;
  velocity: number;
}

@Component({
  selector: 'app-clients-section',
  imports: [],
  templateUrl: './clients-section.html',
  styleUrl: './clients-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsSection {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  private readonly scrollSpeed = 55;
  private readonly resumeDelay = 2000;
  private readonly driftFriction = 0.92;
  private readonly driftReleaseFactor = 0.9;
  private readonly minDriftVelocity = 0.1;
  private readonly maxDriftVelocity = 1.8;
  private readonly prefersReducedMotion =
    this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  private frameId = 0;
  private lastFrameTime = 0;
  private resumeAt = 0;
  private drag: DragState | null = null;
  private driftVelocity = 0;
  private pointerInside = false;

  protected readonly isDragging = signal(false);

  protected readonly clients: readonly ClientTestimonial[] = [
    {
      project: 'Estructuras para planta minera',
      testimonial:
        'La precisión y el cumplimiento de plazos fueron clave para poner en marcha nuestra planta sin retrasos.',
      name: 'Carolina Méndez',
      role: 'Jefa de Proyectos, Andes Minerals',
      initials: 'CM',
      color: '#2e7d6f',
    },
    {
      project: 'Barandas y pasarelas industriales',
      testimonial:
        'El equipo entendió nuestros requerimientos de seguridad desde la primera visita y entregó todo certificado.',
      name: 'Rodrigo Salas',
      role: 'Gerente de Operaciones, Puerto Norte',
      initials: 'RS',
      color: '#41636f',
    },
    {
      project: 'Mobiliario metálico corporativo',
      testimonial:
        'Lograron interpretar el diseño de nuestro estudio y fabricar piezas impecables para toda la oficina.',
      name: 'Valentina Ruiz',
      role: 'Directora de Diseño, Estudio Bruma',
      initials: 'VR',
      color: '#b07a45',
    },
    {
      project: 'Soportes para paneles solares',
      testimonial:
        'Recibimos una solución a medida, con materiales trazables y una coordinación impecable en terreno.',
      name: 'Diego Fuentes',
      role: 'Coordinador de Obras, Solar Austral',
      initials: 'DF',
      color: '#6b7f6a',
    },
    {
      project: 'Mantenimiento de línea de producción',
      testimonial:
        'Respondieron con rapidez a una falla crítica y dejaron la línea operando el mismo día. Excelente soporte.',
      name: 'Paula Herrera',
      role: 'Supervisora de Planta, Agroindustrial Maipo',
      initials: 'PH',
      color: '#8a6a4f',
    },
    {
      project: 'Señalética y escultura urbana',
      testimonial:
        'La calidad de la terminación superó lo esperado y el montaje se realizó con un cuidado impecable.',
      name: 'Ignacio Torres',
      role: 'Encargado de Espacios Públicos, Municipalidad de Ñuñoa',
      initials: 'IT',
      color: '#3f7b6f',
    },
  ];

  constructor() {
    afterNextRender(() => {
      if (!this.prefersReducedMotion) {
        this.startAutoScroll();
      }
    });

    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.frameId));
  }

  /**
   * Pausa el desplazamiento automático mientras el usuario interactúa y lo
   * reanuda automáticamente tras unos segundos sin actividad.
   */
  protected scheduleResume(): void {
    if (this.prefersReducedMotion) {
      return;
    }

    this.resumeAt = performance.now() + this.resumeDelay;
  }

  /** Detiene el movimiento automático mientras el puntero está sobre las tarjetas. */
  protected onPointerEnter(): void {
    this.pointerInside = true;
  }

  /** Reactiva el movimiento automático tras salir de las tarjetas. */
  protected onPointerLeave(): void {
    this.pointerInside = false;
    this.scheduleResume();
  }

  /** Inicia el arrastre horizontal con puntero (mouse, touch o lápiz). */
  protected startDrag(event: PointerEvent): void {
    const viewport = this.viewport().nativeElement;
    const now = performance.now();

    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
    };
    this.driftVelocity = 0;
    this.isDragging.set(true);

    if (typeof event.pointerId === 'number') {
      viewport.setPointerCapture?.(event.pointerId);
    }

    this.scheduleResume();
  }

  /** Desplaza la lista siguiendo el puntero mientras se mantiene pulsado. */
  protected moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }

    const viewport = this.viewport().nativeElement;
    const now = performance.now();
    const elapsed = now - this.drag.lastTime;

    viewport.scrollLeft = this.drag.startScrollLeft - (event.clientX - this.drag.startX);

    // Velocidad suavizada (px/ms) para calcular la inercia al soltar.
    if (elapsed > 0) {
      const instantVelocity = (this.drag.lastX - event.clientX) / elapsed;
      this.drag.velocity = this.drag.velocity * 0.65 + instantVelocity * 0.35;
    }

    this.drag.lastX = event.clientX;
    this.drag.lastTime = now;

    // Mantiene el bucle continuo también durante el arrastre.
    const halfWidth = viewport.scrollWidth / 2;

    if (halfWidth > 0 && viewport.scrollLeft >= halfWidth) {
      viewport.scrollLeft -= halfWidth;
      this.drag.startScrollLeft -= halfWidth;
    }

    this.scheduleResume();
  }

  /** Finaliza el arrastre y reactiva el movimiento automático tras unos segundos. */
  protected endDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }

    const viewport = this.viewport().nativeElement;
    const idleTime = performance.now() - this.drag.lastTime;
    const velocity = Math.max(
      -this.maxDriftVelocity,
      Math.min(this.maxDriftVelocity, this.drag.velocity),
    );

    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture?.(event.pointerId);
    }

    this.drag = null;
    this.isDragging.set(false);

    // Solo se desliza si se soltó con movimiento reciente y suficiente impulso.
    if (
      !this.prefersReducedMotion &&
      idleTime < 120 &&
      Math.abs(velocity) >= this.minDriftVelocity
    ) {
      this.driftVelocity = velocity * this.driftReleaseFactor;
    }

    this.scheduleResume();
  }

  /** Cancela el arrastre sin aplicar inercia (gesto interrumpido). */
  protected cancelDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) {
      return;
    }

    this.drag = null;
    this.isDragging.set(false);
    this.scheduleResume();
  }

  private startAutoScroll(): void {
    const viewport = this.viewport().nativeElement;

    const tick = (time: number) => {
      const halfWidth = viewport.scrollWidth / 2;
      const elapsed = this.lastFrameTime ? Math.min(time - this.lastFrameTime, 64) : 0;
      this.lastFrameTime = time;

      if (halfWidth > 0 && !this.drag) {
        if (this.driftVelocity !== 0) {
          // Inercia del arrastre: desaceleración gradual hasta detenerse.
          viewport.scrollLeft += this.driftVelocity * elapsed;
          this.driftVelocity *= Math.pow(this.driftFriction, elapsed / (1000 / 60));

          if (Math.abs(this.driftVelocity) < this.minDriftVelocity / 4) {
            this.driftVelocity = 0;
          }

          if (viewport.scrollLeft >= halfWidth) {
            viewport.scrollLeft -= halfWidth;
          } else if (viewport.scrollLeft <= 0 && this.driftVelocity < 0) {
            viewport.scrollLeft = 0;
            this.driftVelocity = 0;
          }
        } else if (!this.pointerInside && time >= this.resumeAt) {
          // Al superar la mitad del recorrido, saltamos al grupo duplicado
          // manteniendo la misma posición visual para lograr el bucle continuo.
          if (viewport.scrollLeft >= halfWidth) {
            viewport.scrollLeft -= halfWidth;
          }

          viewport.scrollLeft += (elapsed * this.scrollSpeed) / 1000;
        }
      }

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }
}
