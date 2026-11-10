import type { Routes } from '@angular/router';
import { authGuard } from '../pagina-Auth/guards/auth-guard';

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
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      {
        path: 'clientes',
        title: 'Clientes | MetaGestor',
        loadComponent: () => import('./tablas/clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'clientes/:idCliente',
        title: 'Perfil de cliente | MetaGestor',
        loadComponent: () =>
          import('./tablas/clientes/perfil-cliente/perfil-cliente').then((m) => m.PerfilCliente),
      },
      {
        path: 'empleados',
        title: 'Empleados | MetaGestor',
        loadComponent: () => import('./tablas/empleados/empleados').then((m) => m.Empleados),
      },
      {
        path: 'tareas',
        title: 'Tareas | MetaGestor',
        loadComponent: () => import('./tablas/tareas/tareas').then((m) => m.Tareas),
      },
      {
        path: 'solicitudes',
        title: 'Solicitudes | MetaGestor',
        loadComponent: () => import('./tablas/solicitudes/solicitudes').then((m) => m.Solicitudes),
      },
      {
        path: 'registros',
        title: 'Registros | MetaGestor',
        loadComponent: () => import('./tablas/registros/registros').then((m) => m.Registros),
      },
    ],
  },
];
