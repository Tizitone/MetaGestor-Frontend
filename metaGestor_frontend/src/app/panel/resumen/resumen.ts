import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PanelData } from '../panel-data/panel-data';
import { PROCESO_LABEL, type ProcesoRegistro } from '../panel.model';

/** Tarjeta clicable del panel de resumen. */
interface Indicador {
  readonly etiqueta: string;
  readonly total: number;
  readonly destino: string;
  readonly detalle: string;
}

/** Agrupa las tarjetas que comparten un mismo encabezado. */
interface GrupoIndicadores {
  readonly titulo: string;
  readonly indicadores: readonly Indicador[];
}

@Component({
  selector: 'app-resumen',
  imports: [RouterLink],
  templateUrl: './resumen.html',
  styleUrls: ['../tablas/page.css', './resumen.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Resumen {
  private readonly data = inject(PanelData);

  protected readonly totalRegistros = computed(() => this.data.registros().length);

  protected readonly grupos = computed<readonly GrupoIndicadores[]>(() => [
    {
      titulo: 'Indicadores generales',
      indicadores: [
        {
          etiqueta: 'Clientes',
          total: this.data.clientes().length,
          destino: '/panel/clientes',
          detalle: 'Ver clientes',
        },
        {
          etiqueta: 'Empleados',
          total: this.data.empleados().length,
          destino: '/panel/empleados',
          detalle: 'Ver empleados',
        },
        {
          etiqueta: 'Tareas',
          total: this.data.tareas().length,
          destino: '/panel/tareas',
          detalle: 'Ver tareas',
        },
        {
          etiqueta: 'Solicitudes pendientes',
          total: this.data.solicitudes().filter((solicitud) => !solicitud.atendido).length,
          destino: '/panel/solicitudes',
          detalle: 'Ver solicitudes',
        },
      ],
    },
    {
      titulo: 'Registros por estado',
      indicadores: (Object.keys(PROCESO_LABEL) as ProcesoRegistro[]).map((proceso) => ({
        etiqueta: PROCESO_LABEL[proceso],
        total: this.data.registros().filter((registro) => registro.proceso === proceso).length,
        destino: '/panel/registros',
        detalle: 'Ver registros',
      })),
    },
  ]);
}
