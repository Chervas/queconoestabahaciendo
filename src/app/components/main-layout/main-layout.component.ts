import { Component, OnInit, ViewChild, HostBinding } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';

import { ActiveTaskDisplayComponent } from '../active-task-display/active-task-display.component';
import { TaskListComponent } from '../task-list/task-list.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskPriority } from '../../core/models/task.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';
import { PhaseService, AppPhase } from '../../core/services/phase.service';
import { NavigationRailComponent } from '../navigation-rail/navigation-rail.component';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSidenavModule,
    ActiveTaskDisplayComponent,
    TaskListComponent,
    ConfirmationDialogComponent,
    TaskFormComponent,
    NavigationRailComponent
  ]
})
export class MainLayoutComponent implements OnInit {
  @ViewChild('taskFormSidenav') taskFormSidenav!: MatSidenav;
  isDarkMode = false;
  tasks$: Observable<Task[]>;
  activeTask$: Observable<Task | null>;
  currentTaskForForm: Task | null = null;
  isSidenavOpen = false;
  
  // Propiedades para el navigation rail
  activeSection: string = 'tasks';
  navigationRailExpanded: boolean = false;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private taskService: TaskService,
    private phaseService: PhaseService
  ) {
    console.log("[MainLayoutComponent] Constructor - Subscribing to taskService observables.");
    this.tasks$ = this.taskService.tasks$;
    this.activeTask$ = this.taskService.activeTask$;
  }

  ngOnInit(): void {
    console.log("[MainLayoutComponent] ngOnInit - Initializing component.");
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference) {
      this.isDarkMode = JSON.parse(storedPreference);
    }
    this.applyTheme();
    console.log("[MainLayoutComponent] ngOnInit - Task loading is handled by TaskService constructor.");
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
    this.activeSection = 'history';
  }

  openTaskFormSidenav(task: Task | null = null): void {
    console.log("[MainLayoutComponent] openTaskFormSidenav called. Task:", task);
    this.currentTaskForForm = task;
    this.isSidenavOpen = true;
    this.taskFormSidenav.open();
  }

  closeTaskFormSidenav(): void {
    this.isSidenavOpen = false;
    this.taskFormSidenav.close();
    this.currentTaskForForm = null;
  }

  handleTaskFormSubmit(taskData: Task): void {
    console.log('[MainLayoutComponent] handleTaskFormSubmit. Data:', taskData);
    if (taskData.id) {
      this.taskService.updateTask(taskData);
    } else {
      const newTask = this.taskService.addTask({
        title: taskData.title,
        priority: taskData.priority as TaskPriority,
        description: taskData.description
      });
      this.showConfirmationToActivate(newTask);
    }
    this.closeTaskFormSidenav();
  }

  showConfirmationToActivate(task: Task): void {
    const dialogData: ConfirmationDialogData = {
      message: `¿Quieres empezar a trabajar en "${task.title}" ahora?`,
      confirmButtonText: 'Sí, empezar ahora',
      cancelButtonText: 'No, añadir a pendientes',
      showCancelButton: true
    };
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      data: dialogData
    });
    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        console.log(`[MainLayoutComponent] ConfirmationDialog: User chose to activate task ${task.id}`);
        this.taskService.setActiveTask(task.id);
      } else {
        console.log(`[MainLayoutComponent] ConfirmationDialog: User chose NOT to activate task ${task.id}`);
      }
    });
  }

  // Método para terminar la jornada laboral y pasar a la fase de recreo
  async endWorkday(): Promise<void> {
    const dialogData: ConfirmationDialogData = {
      message: '¿Quieres terminar tu jornada laboral y pasar a tu isla?',
      confirmButtonText: 'Sí, ir a mi isla',
      cancelButtonText: 'No, seguir trabajando',
      showCancelButton: true
    };
    
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      data: dialogData
    });
    
    confirmDialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        console.log('[MainLayoutComponent] User confirmed to end workday and go to recreation phase');
        
        if (this.phaseService.hasAccessedRecreationToday()) {
          console.log('[MainLayoutComponent] User already accessed recreation phase today');
          this.showRecreationAccessDeniedDialog();
        } else {
          this.phaseService.transitionToRecreationPhase();
          console.log('[MainLayoutComponent] Successfully transitioned to recreation phase');
        }
      } else {
        console.log('[MainLayoutComponent] User cancelled transition to recreation phase');
      }
    });
  }
  
  // Método para mostrar el diálogo de aviso cuando se intenta acceder a la fase de recreo más de una vez al día
  showRecreationAccessDeniedDialog(): void {
    const dialogData: ConfirmationDialogData = {
      message: 'Ya has entrado en tu isla hoy. Podrás volver a visitarla mañana, tras completar una nueva jornada.',
      confirmButtonText: 'Entendido',
      cancelButtonText: '',
      showCancelButton: false
    };
    
    this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      data: dialogData
    });
  }
  
  // Métodos para el navigation rail
  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId;
    
    // Navegar a la ruta correspondiente según la sección seleccionada
    switch(sectionId) {
      case 'tasks':
        this.router.navigate(['/']);
        break;
      case 'habits':
        this.router.navigate(['/habits']);
        break;
      case 'history':
        this.router.navigate(['/history']);
        break;
      case 'island':
        this.router.navigate(['/mi-isla']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
  
  onNavigationRailExpandedChange(expanded: boolean): void {
    this.navigationRailExpanded = expanded;
  }
}
