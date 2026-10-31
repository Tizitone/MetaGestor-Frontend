import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'MetaGestor | Soluciones metalúrgicas personalizadas',
    loadComponent: () => import('./landing/landing-page').then((m) => m.LandingPage),
  },
  { path: '**', redirectTo: '' },
];
