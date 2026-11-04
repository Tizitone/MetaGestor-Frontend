import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'panel',
    loadChildren: () => import('./panel/panel.routes').then((m) => m.PANEL_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
