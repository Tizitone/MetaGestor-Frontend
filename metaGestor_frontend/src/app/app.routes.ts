import { Routes } from '@angular/router';
import { InicioPantalla } from './pagina-Inicio/inicioPantalla/inicio-pantalla';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioPantalla },
  {
    path: 'login',
    loadComponent: () =>
      import('./pagina-Auth/autenticacionPantalla/autenticacion-pantalla').then(
        (modulo) => modulo.AutenticacionPantalla,
      ),
  },
  {
    path: 'panel',
    loadChildren: () => import('./panel/panel.routes').then((modulo) => modulo.PANEL_ROUTES),
  },
  { path: '**', redirectTo: 'inicio' },
    {
    path: '',
    title: 'Panel de gestión | MetaGestor',
    loadComponent: () => import('./panel').then((m) => m.Panel),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      {
        path: 'clientes',
        title: 'Clientes | MetaGestor',
        loadComponent: () => import('./clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'empleados',
        title: 'Empleados | MetaGestor',
        loadComponent: () => import('./empleados/empleados').then((m) => m.Empleados),
      },
      {
        path: 'tareas',
        title: 'Tareas | MetaGestor',
        loadComponent: () => import('./tareas/tareas').then((m) => m.Tareas),
      },
      {
        path: 'solicitudes',
        title: 'Solicitudes | MetaGestor',
        loadComponent: () => import('./solicitudes/solicitudes').then((m) => m.Solicitudes),
      },
      {
        path: 'registros',
        title: 'Registros | MetaGestor',
        loadComponent: () => import('./registros/registros').then((m) => m.Registros),
      },
    ],
  },
];
