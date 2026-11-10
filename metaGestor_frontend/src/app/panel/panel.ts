import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from '../pagina-Auth/servicios/sesion-service';
import { PanelData } from './panel-data';

@Component({
  selector: 'app-panel',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Panel {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  private readonly data = inject(PanelData);
  protected readonly rol = this.sesion.rol;

  constructor()
  {
    console.log(this.sesion.rol.toString());
  }

  protected readonly sections = computed(() => 
  {if(this.sesion.rol.toString().includes("ADMIN")){
    return [
    { path: '/panel/clientes', label: 'Clientes', count: this.data.clientes().length },
    { path: '/panel/empleados', label: 'Empleados', count: this.data.empleados().length },
    { path: '/panel/tareas', label: 'Tareas', count: this.data.tareas().length },
    { path: '/panel/solicitudes', label: 'Solicitudes', count: this.data.solicitudes().length },
    { path: '/panel/registros', label: 'Registros', count: this.data.registros().length },
  ]
  }
  else if(this.sesion.rol.toString().includes("GERENTE"))
  {
    return [
      { path: '/panel/clientes', label: 'Clientes', count: this.data.clientes().length },
      { path: '/panel/solicitudes', label: 'Solicitudes', count: this.data.solicitudes().length },
      { path: '/panel/tareas', label: 'Tareas', count: this.data.tareas().length },
      { path: '/panel/registros', label: 'Registros', count: this.data.registros().length },
    ]
  }
  else if(this.sesion.rol.toString().includes("EMPLEADO"))
  {
    return [
      { path: '/panel/tareas', label: 'Tareas', count: this.data.buscarHistorialEmpleados().length },
    ]
  }
  else if(this.sesion.rol.toString().includes("CLIENTE")){
    this.data.idActual.set(Number(this.sesion.idUsuario()));
    return [
      { path: '/panel/registros', label: 'Registros', count: this.data.buscarRegistrosCliente().length }
    ]
  }
  return [];
  });

  protected readonly today = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(
    new Date(),
  );

  protected cerrarSesion(): void {
    this.sesion.cerrarSesion();
    this.data.idActual.set(0);
    void this.router.navigate(['/login']);
  }
}
