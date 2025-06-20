import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', component: MainLayoutComponent }, // Default route to MainLayoutComponent
  {
    path: 'historial',
    loadComponent: () => import('./components/historial/historial.component').then(m => m.HistorialComponent)
  },
  { 
    path: 'mi-isla', 
    loadComponent: () => import('./components/my-island/my-island.component').then(m => m.MyIslandComponent) 
  },
  { 
    path: 'habits', 
    loadComponent: () => import('./components/habits-panel/habits-panel.component').then(m => m.HabitsPanelComponent) 
  },
  { path: '**', redirectTo: '' } // Wildcard route
];
