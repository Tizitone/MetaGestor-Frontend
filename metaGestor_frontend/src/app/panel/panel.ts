import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PanelData } from './panel-data';

@Component({
  selector: 'app-panel',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Panel {
  private readonly router = inject(Router);

  private readonly data = inject(PanelData);
  protected readonly rol = this.sesion.rol;

  protected readonly sections = computed(() => [
    { path: '/panel/clientes', label: 'Clientes', count: this.data.clientes().length },
    { path: '/panel/empleados', label: 'Empleados', count: this.data.empleados().length },
    { path: '/panel/tareas', label: 'Tareas', count: this.data.tareas().length },
    { path: '/panel/solicitudes', label: 'Solicitudes', count: this.data.solicitudes().length },
    { path: '/panel/registros', label: 'Registros', count: this.data.registros().length },
  ]);

  protected readonly today = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(
    new Date(),
  );

  protected cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
