import type { Routes } from '@angular/router';
import {
  perfilEmpleadoGuard,
  sinAbmEmpleadoGuard,
} from '../pagina-Auth/guards/empleado-guard';
import { perfilGerenteGuard } from '../pagina-Auth/guards/gerente-guard';
import { authGuard } from '../pagina-Auth/guards/auth-guard';
import { redireccionInicioPanel } from '../pagina-Auth/guards/redireccion-por-rol';

/**
 * Rutas del panel de gestión.
 *
 * Se cargan de forma perezosa desde `app.routes.ts` y cada sección se carga
 * solo cuando el usuario navega a ella. Todas exigen una sesión iniciada.
 */
export const PANEL_ROUTES: Routes = [
  {
    path: '',
    title: 'Panel de gestión | MetaGestor',
    canActivate: [authGuard],
    loadComponent: () => import('./panel').then((m) => m.Panel),
    children: [
      { path: '', pathMatch: 'full', redirectTo: redireccionInicioPanel },
      {
        path: 'clientes',
        title: 'Clientes | MetaGestor',
        canActivate: [sinAbmEmpleadoGuard],
        loadComponent: () => import('./tablas/clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'clientes/:idCliente',
        title: 'Perfil de cliente | MetaGestor',
        canActivate: [sinAbmEmpleadoGuard],
        loadComponent: () =>
          import('./tablas/clientes/perfil-cliente/perfil-cliente').then((m) => m.PerfilCliente),
      },
      {
        path: 'empleados',
        title: 'Empleados | MetaGestor',
        canActivate: [sinAbmEmpleadoGuard],
        loadComponent: () => import('./tablas/empleados/empleados').then((m) => m.Empleados),
      },
      {
        path: 'empleados/:legajo',
        title: 'Perfil de empleado | MetaGestor',
        canActivate: [perfilEmpleadoGuard],
        loadComponent: () =>
          import('./tablas/empleados/perfil-empleado/perfil-empleado').then(
            (m) => m.PerfilEmpleado,
          ),
      },
      {
        path: 'gerentes/:legajo',
        title: 'Perfil de gerente | MetaGestor',
        canActivate: [perfilGerenteGuard],
        loadComponent: () =>
          import('./tablas/gerentes/perfil-gerente/perfil-gerente').then(
            (m) => m.PerfilGerente,
          ),
      },
      {
        path: 'tareas',
        title: 'Tareas | MetaGestor',
        loadComponent: () => import('./tablas/tareas/tareas').then((m) => m.Tareas),
      },
      {
        path: 'solicitudes',
        title: 'Solicitudes | MetaGestor',
        canActivate: [sinAbmEmpleadoGuard],
        loadComponent: () => import('./tablas/solicitudes/solicitudes').then((m) => m.Solicitudes),
      },
      {
        path: 'registros',
        title: 'Registros | MetaGestor',
        canActivate: [sinAbmEmpleadoGuard],
        loadComponent: () => import('./tablas/registros/registros').then((m) => m.Registros),
      },
    ],
  },
];
