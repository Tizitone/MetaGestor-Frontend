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
];
