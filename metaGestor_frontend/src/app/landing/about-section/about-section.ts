import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Benefit {
  readonly title: string;
  readonly description: string;
}

interface ComparisonRow {
  readonly feature: string;
  readonly metaGestor: string;
  readonly competitor: string;
}

@Component({
  selector: 'app-about-section',
  imports: [],
  templateUrl: './about-section.html',
  styleUrl: './about-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  protected readonly benefits: readonly Benefit[] = [
    {
      title: 'Ingeniería a medida',
      description:
        'Modelamos cada pieza en CAD y validamos el diseño contigo antes de iniciar la fabricación.',
    },
    {
      title: 'Fabricación de precisión',
      description:
        'Corte, plegado, mecanizado y soldadura calificada bajo estrictos controles dimensionales.',
    },
    {
      title: 'Calidad trazable',
      description: 'Ensayos, inspección visual y documentación completa de cada lote producido.',
    },
    {
      title: 'Plazos confiables',
      description: 'Planificación realista y comunicación permanente del avance de tu proyecto.',
    },
  ];

  protected readonly comparisonRows: readonly ComparisonRow[] = [
    {
      feature: 'Plazo de entrega',
      metaGestor: '5 a 10 días hábiles',
      competitor: '15 a 25 días hábiles',
    },
    {
      feature: 'Tolerancia de fabricación',
      metaGestor: '±0,2 mm',
      competitor: '±1,0 mm',
    },
    {
      feature: 'Certificación de soldadura',
      metaGestor: 'AWS D1.1 / ASME IX',
      competitor: 'No especificada',
    },
    {
      feature: 'Control de calidad',
      metaGestor: 'Inspección 100 % + trazabilidad',
      competitor: 'Muestreo parcial',
    },
    {
      feature: 'Materiales certificados',
      metaGestor: 'Siempre, con colada trazable',
      competitor: 'Según disponibilidad',
    },
    {
      feature: 'Garantía',
      metaGestor: '24 meses',
      competitor: '6 meses',
    },
    {
      feature: 'Soporte postventa',
      metaGestor: 'Dedicado 24/7',
      competitor: 'Horario comercial',
    },
    {
      feature: 'Cotización',
      metaGestor: 'En 48 horas',
      competitor: '5 a 7 días',
    },
  ];
}
