import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Beneficio {
  readonly titulo: string;
  readonly descripcion: string;
}

interface FilaComparativa {
  readonly aspecto: string;
  readonly metaGestor: string;
  readonly competencia: string;
}

@Component({
  selector: 'app-descripcion-component',
  imports: [],
  templateUrl: './descripcion-component.html',
  styleUrl: './descripcion-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescripcionComponent {
  protected readonly beneficios: readonly Beneficio[] = [
    {
      titulo: 'Ingeniería a medida',
      descripcion:
        'Modelamos cada pieza en CAD y validamos el diseño contigo antes de iniciar la fabricación.',
    },
    {
      titulo: 'Fabricación de precisión',
      descripcion:
        'Corte, plegado, mecanizado y soldadura calificada bajo estrictos controles dimensionales.',
    },
    {
      titulo: 'Calidad trazable',
      descripcion: 'Ensayos, inspección visual y documentación completa de cada lote producido.',
    },
    {
      titulo: 'Plazos confiables',
      descripcion: 'Planificación realista y comunicación permanente del avance de tu proyecto.',
    },
  ];

  protected readonly filasComparativa: readonly FilaComparativa[] = [
    {
      aspecto: 'Plazo de entrega',
      metaGestor: '5 a 10 días hábiles',
      competencia: '15 a 25 días hábiles',
    },
    {
      aspecto: 'Tolerancia de fabricación',
      metaGestor: '±0,2 mm',
      competencia: '±1,0 mm',
    },
    {
      aspecto: 'Certificación de soldadura',
      metaGestor: 'AWS D1.1 / ASME IX',
      competencia: 'No especificada',
    },
    {
      aspecto: 'Control de calidad',
      metaGestor: 'Inspección 100 % + trazabilidad',
      competencia: 'Muestreo parcial',
    },
    {
      aspecto: 'Materiales certificados',
      metaGestor: 'Siempre, con colada trazable',
      competencia: 'Según disponibilidad',
    },
    {
      aspecto: 'Garantía',
      metaGestor: '24 meses',
      competencia: '6 meses',
    },
    {
      aspecto: 'Soporte postventa',
      metaGestor: 'Dedicado 24/7',
      competencia: 'Horario comercial',
    },
    {
      aspecto: 'Cotización',
      metaGestor: 'En 48 horas',
      competencia: '5 a 7 días',
    },
  ];
}
