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

interface ComentarioCliente {
  readonly proyecto: string;
  readonly testimonio: string;
  readonly nombre: string;
  readonly cargo: string;
  readonly iniciales: string;
  readonly color: string;
}

interface EstadoArrastre {
  readonly idPuntero: number;
  readonly inicioX: number;
  desplazamientoInicial: number;
  ultimaX: number;
  ultimoTiempo: number;
  velocidad: number;
}

@Component({
  selector: 'app-comentarios-component',
  imports: [],
  templateUrl: './comentarios-component.html',
  styleUrl: './comentarios-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComentariosComponent {
  private readonly documento = inject(DOCUMENT);
  private readonly referenciaDestruccion = inject(DestroyRef);
  private readonly visor = viewChild.required<ElementRef<HTMLElement>>('visor');

  private readonly velocidadDesplazamiento = 55;
  private readonly retrasoReanudacion = 2000;
  private readonly friccionDeriva = 0.92;
  private readonly factorLiberacionDeriva = 0.9;
  private readonly velocidadMinimaDeriva = 0.1;
  private readonly velocidadMaximaDeriva = 1.8;
  private readonly prefiereMovimientoReducido =
    this.documento.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  private idFotograma = 0;
  private ultimoTiempoFotograma = 0;
  private reanudarEn = 0;
  private arrastre: EstadoArrastre | null = null;
  private velocidadDeriva = 0;
  private punteroDentro = false;

  protected readonly estaArrastrando = signal(false);

  protected readonly comentarios: readonly ComentarioCliente[] = [
    {
      proyecto: 'Estructuras para planta minera',
      testimonio:
        'La precisión y el cumplimiento de plazos fueron clave para poner en marcha nuestra planta sin retrasos.',
      nombre: 'Carolina Méndez',
      cargo: 'Jefa de Proyectos, Andes Minerals',
      iniciales: 'CM',
      color: '#2e7d6f',
    },
    {
      proyecto: 'Barandas y pasarelas industriales',
      testimonio:
        'El equipo entendió nuestros requerimientos de seguridad desde la primera visita y entregó todo certificado.',
      nombre: 'Rodrigo Salas',
      cargo: 'Gerente de Operaciones, Puerto Norte',
      iniciales: 'RS',
      color: '#41636f',
    },
    {
      proyecto: 'Mobiliario metálico corporativo',
      testimonio:
        'Lograron interpretar el diseño de nuestro estudio y fabricar piezas impecables para toda la oficina.',
      nombre: 'Valentina Ruiz',
      cargo: 'Directora de Diseño, Estudio Bruma',
      iniciales: 'VR',
      color: '#b07a45',
    },
    {
      proyecto: 'Soportes para paneles solares',
      testimonio:
        'Recibimos una solución a medida, con materiales trazables y una coordinación impecable en terreno.',
      nombre: 'Diego Fuentes',
      cargo: 'Coordinador de Obras, Solar Austral',
      iniciales: 'DF',
      color: '#6b7f6a',
    },
    {
      proyecto: 'Mantenimiento de línea de producción',
      testimonio:
        'Respondieron con rapidez a una falla crítica y dejaron la línea operando el mismo día. Excelente soporte.',
      nombre: 'Paula Herrera',
      cargo: 'Supervisora de Planta, Agroindustrial Maipo',
      iniciales: 'PH',
      color: '#8a6a4f',
    },
    {
      proyecto: 'Señalética y escultura urbana',
      testimonio:
        'La calidad de la terminación superó lo esperado y el montaje se realizó con un cuidado impecable.',
      nombre: 'Ignacio Torres',
      cargo: 'Encargado de Espacios Públicos, Municipalidad de Ñuñoa',
      iniciales: 'IT',
      color: '#3f7b6f',
    },
  ];

  constructor() {
    afterNextRender(() => {
      if (!this.prefiereMovimientoReducido) {
        this.iniciarDesplazamientoAutomatico();
      }
    });

    this.referenciaDestruccion.onDestroy(() => cancelAnimationFrame(this.idFotograma));
  }

  /**
   * Pausa el desplazamiento automático mientras el usuario interactúa y lo
   * reanuda automáticamente tras unos segundos sin actividad.
   */
  protected programarReanudacion(): void {
    if (this.prefiereMovimientoReducido) {
      return;
    }

    this.reanudarEn = performance.now() + this.retrasoReanudacion;
  }

  /** Detiene el movimiento automático mientras el puntero está sobre las tarjetas. */
  protected alEntrarPuntero(): void {
    this.punteroDentro = true;
  }

  /** Reactiva el movimiento automático tras salir de las tarjetas. */
  protected alSalirPuntero(): void {
    this.punteroDentro = false;
    this.programarReanudacion();
  }

  /** Inicia el arrastre horizontal con puntero (mouse, touch o lápiz). */
  protected iniciarArrastre(evento: PointerEvent): void {
    const visor = this.visor().nativeElement;
    const ahora = performance.now();

    this.arrastre = {
      idPuntero: evento.pointerId,
      inicioX: evento.clientX,
      desplazamientoInicial: visor.scrollLeft,
      ultimaX: evento.clientX,
      ultimoTiempo: ahora,
      velocidad: 0,
    };
    this.velocidadDeriva = 0;
    this.estaArrastrando.set(true);

    if (typeof evento.pointerId === 'number') {
      visor.setPointerCapture?.(evento.pointerId);
    }

    this.programarReanudacion();
  }

  /** Desplaza la lista siguiendo el puntero mientras se mantiene pulsado. */
  protected moverArrastre(evento: PointerEvent): void {
    if (!this.arrastre || this.arrastre.idPuntero !== evento.pointerId) {
      return;
    }

    const visor = this.visor().nativeElement;
    const ahora = performance.now();
    const transcurrido = ahora - this.arrastre.ultimoTiempo;

    visor.scrollLeft =
      this.arrastre.desplazamientoInicial - (evento.clientX - this.arrastre.inicioX);

    // Velocidad suavizada (px/ms) para calcular la inercia al soltar.
    if (transcurrido > 0) {
      const velocidadInstantanea = (this.arrastre.ultimaX - evento.clientX) / transcurrido;
      this.arrastre.velocidad = this.arrastre.velocidad * 0.65 + velocidadInstantanea * 0.35;
    }

    this.arrastre.ultimaX = evento.clientX;
    this.arrastre.ultimoTiempo = ahora;

    // Mantiene el bucle continuo también durante el arrastre.
    const mitadAncho = visor.scrollWidth / 2;

    if (mitadAncho > 0 && visor.scrollLeft >= mitadAncho) {
      visor.scrollLeft -= mitadAncho;
      this.arrastre.desplazamientoInicial -= mitadAncho;
    }

    this.programarReanudacion();
  }

  /** Finaliza el arrastre y reactiva el movimiento automático tras unos segundos. */
  protected finalizarArrastre(evento: PointerEvent): void {
    if (!this.arrastre || this.arrastre.idPuntero !== evento.pointerId) {
      return;
    }

    const visor = this.visor().nativeElement;
    const tiempoInactivo = performance.now() - this.arrastre.ultimoTiempo;
    const velocidad = Math.max(
      -this.velocidadMaximaDeriva,
      Math.min(this.velocidadMaximaDeriva, this.arrastre.velocidad),
    );

    if (visor.hasPointerCapture?.(evento.pointerId)) {
      visor.releasePointerCapture?.(evento.pointerId);
    }

    this.arrastre = null;
    this.estaArrastrando.set(false);

    // Solo se desliza si se soltó con movimiento reciente y suficiente impulso.
    if (
      !this.prefiereMovimientoReducido &&
      tiempoInactivo < 120 &&
      Math.abs(velocidad) >= this.velocidadMinimaDeriva
    ) {
      this.velocidadDeriva = velocidad * this.factorLiberacionDeriva;
    }

    this.programarReanudacion();
  }

  /** Cancela el arrastre sin aplicar inercia (gesto interrumpido). */
  protected cancelarArrastre(evento: PointerEvent): void {
    if (!this.arrastre || this.arrastre.idPuntero !== evento.pointerId) {
      return;
    }

    this.arrastre = null;
    this.estaArrastrando.set(false);
    this.programarReanudacion();
  }

  private iniciarDesplazamientoAutomatico(): void {
    const visor = this.visor().nativeElement;

    const ciclo = (tiempo: number) => {
      const mitadAncho = visor.scrollWidth / 2;
      const transcurrido = this.ultimoTiempoFotograma
        ? Math.min(tiempo - this.ultimoTiempoFotograma, 64)
        : 0;
      this.ultimoTiempoFotograma = tiempo;

      if (mitadAncho > 0 && !this.arrastre) {
        if (this.velocidadDeriva !== 0) {
          // Inercia del arrastre: desaceleración gradual hasta detenerse.
          visor.scrollLeft += this.velocidadDeriva * transcurrido;
          this.velocidadDeriva *= Math.pow(this.friccionDeriva, transcurrido / (1000 / 60));

          if (Math.abs(this.velocidadDeriva) < this.velocidadMinimaDeriva / 4) {
            this.velocidadDeriva = 0;
          }

          if (visor.scrollLeft >= mitadAncho) {
            visor.scrollLeft -= mitadAncho;
          } else if (visor.scrollLeft <= 0 && this.velocidadDeriva < 0) {
            visor.scrollLeft = 0;
            this.velocidadDeriva = 0;
          }
        } else if (!this.punteroDentro && tiempo >= this.reanudarEn) {
          // Al superar la mitad del recorrido, saltamos al grupo duplicado
          // manteniendo la misma posición visual para lograr el bucle continuo.
          if (visor.scrollLeft >= mitadAncho) {
            visor.scrollLeft -= mitadAncho;
          }

          visor.scrollLeft += (transcurrido * this.velocidadDesplazamiento) / 1000;
        }
      }

      this.idFotograma = requestAnimationFrame(ciclo);
    };

    this.idFotograma = requestAnimationFrame(ciclo);
  }
}
