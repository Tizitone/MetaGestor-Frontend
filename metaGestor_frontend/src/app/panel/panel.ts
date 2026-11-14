import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from '../pagina-Auth/servicios/sesion-service';
import { PanelData } from './panel-data/panel-data';

/** Enlace del menú lateral del panel. */
interface SeccionPanel {
  readonly path: string;
  readonly label: string;
  readonly count?: number;
}

@Component({
  selector: 'app-panel',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Una instancia por sesión: así el rol con el que se cargan los datos se
  // renueva al volver a iniciar sesión.
  providers: [PanelData],
})
export class Panel {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  private readonly data = inject(PanelData);
  protected readonly rol = this.sesion.rol;

  protected readonly sections = computed<SeccionPanel[]>(() => {
    // Obtenemos el valor actual de la signal del rol
    const currentRol = this.rol()?.toString().toUpperCase() || '';

    if (currentRol.includes('ADMIN')) {
      return [
        { path: '/panel/clientes', label: 'Clientes', count: this.data.clientes().length },
        { path: '/panel/empleados', label: 'Empleados', count: this.data.empleados().length },
        { path: '/panel/tareas', label: 'Tareas', count: this.data.tareas().length },
        { path: '/panel/solicitudes', label: 'Solicitudes', count: this.data.solicitudes().length },
        { path: '/panel/registros', label: 'Registros', count: this.data.registros().length },
      ];
    }

    if (currentRol.includes('GERENTE')) {
      return [
        { path: '/panel/clientes', label: 'Clientes', count: this.data.clientes().length },
        { path: '/panel/solicitudes', label: 'Solicitudes', count: this.data.solicitudes().length },
        { path: '/panel/tareas', label: 'Tareas', count: this.data.tareas().length },
        { path: '/panel/registros', label: 'Registros', count: this.data.registros().length },
      ];
    }

    if (currentRol.includes('EMPLEADO')) {
      const idUsuario = this.sesion.idUsuario();

      return [
        // El empleado siempre puede volver a su perfil desde cualquier sección.
        ...(idUsuario
          ? [{ path: `/panel/empleados/${idUsuario}`, label: 'Mi perfil' } as const]
          : []),
        {
          path: '/panel/tareas',
          label: 'Tareas',
          count: this.data.buscarHistorialEmpleados().length,
        },
      ];
    }

    if (currentRol.includes('CLIENTE')) {
      const idUsuario = this.sesion.idUsuario();

      return [
        // El cliente siempre puede volver a su perfil desde cualquier sección.
        ...(idUsuario
          ? [{ path: `/panel/clientes/${idUsuario}`, label: 'Mi perfil' } as const]
          : []),
        {
          path: '/panel/registros',
          label: 'Registros',
          count: this.data.buscarRegistrosCliente().length,
        },
      ];
    }

    return [];
  });

  protected readonly today = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(
    new Date(),
  );

  protected cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}
