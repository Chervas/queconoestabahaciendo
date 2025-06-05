import { ApplicationConfig, isDevMode, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HabitService } from './core/services/habit.service';
import { PhaseService } from './core/services/phase.service';
import { HistoryService } from './core/services/history.service';
import { EventBusService } from './core/services/event-bus.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(CommonModule),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(MatDialogModule),
    importProvidersFrom(MatSnackBarModule),
    importProvidersFrom(MatMenuModule),
    importProvidersFrom(MatIconModule),
    importProvidersFrom(MatButtonModule),
    importProvidersFrom(MatSidenavModule),
    importProvidersFrom(MatCardModule),
    importProvidersFrom(MatProgressBarModule),
    importProvidersFrom(MatFormFieldModule),
    importProvidersFrom(MatInputModule),
    importProvidersFrom(MatSelectModule),
    importProvidersFrom(MatToolbarModule),
    importProvidersFrom(MatTooltipModule),
    importProvidersFrom(MatRippleModule),
    EventBusService,
    HabitService,
    PhaseService,
    HistoryService
  ]
};
