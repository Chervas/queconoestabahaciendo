import { Component, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { HabitService } from '../../core/services/habit.service';
import { Habit, HabitFrequency, HabitType, CreateHabitDTO, UpdateHabitDTO } from '../../core/models/habit.model';
import { HabitItemComponent } from '../habit-item/habit-item.component';
import { HabitFormComponent } from '../habit-form/habit-form.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { NavigationRailComponent } from '../navigation-rail/navigation-rail.component';
import { PhaseService, AppPhase } from '../../core/services/phase.service';

@Component({
  selector: 'app-habits-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    HabitItemComponent,
    HabitFormComponent,
    NavigationRailComponent
  ],
  templateUrl: './habits-panel.component.html',
  styleUrls: ['./habits-panel.component.css']
})
export class HabitsPanelComponent implements OnInit, OnDestroy {
  @ViewChild('habitFormSidenav') habitFormSidenav: any;
  
  habits: Habit[] = [];
  dailyHabits: Habit[] = [];
  weeklyHabits: Habit[] = [];
  monthlyHabits: Habit[] = [];
  quitHabits: Habit[] = [];
  
  isSidenavOpen = false;
  currentHabitForForm: Habit | null = null;
  
  completedDailyCount = 0;
  completedWeeklyCount = 0;
  // CORRECCIÓN: Añadir contador para hábitos mensuales completados
  completedMonthlyCount = 0;
  
  currentPhase: AppPhase = AppPhase.WORK;
  
  private habitService = inject(HabitService);
  private dialog = inject(MatDialog);
  private phaseService = inject(PhaseService);
  private phaseSubscription?: Subscription;
  
  ngOnInit(): void {
    this.loadHabits();
    this.currentPhase = this.phaseService.getCurrentPhase();
    
    // Suscribirse a cambios en la fase
    this.phaseSubscription = this.phaseService.phaseState$.subscribe(state => {
      this.currentPhase = state.currentPhase;
    });
  }
  
  ngOnDestroy(): void {
    // Cancelar suscripciones para evitar memory leaks
    if (this.phaseSubscription) {
      this.phaseSubscription.unsubscribe();
    }
  }
  
  get hasHabits(): boolean {
    return this.habits.length > 0;
  }
  
  get hasMonthlyHabits(): boolean {
    return this.monthlyHabits.length > 0;
  }
  
  loadHabits(): void {
    this.habits = this.habitService.getHabits();
    this.filterHabits();
    this.updateCompletedCounts();
  }
  
  filterHabits(): void {
    // Filtrar por frecuencia y ordenar (completados al final)
    this.dailyHabits = this.habits
      .filter(h => h.frequency === HabitFrequency.DAILY && h.type === HabitType.COUNTER)
      .sort((a, b) => this.sortHabits(a, b));
      
    this.weeklyHabits = this.habits
      .filter(h => h.frequency === HabitFrequency.WEEKLY && h.type === HabitType.COUNTER)
      .sort((a, b) => this.sortHabits(a, b));
      
    this.monthlyHabits = this.habits
      .filter(h => h.frequency === HabitFrequency.MONTHLY && h.type === HabitType.COUNTER)
      .sort((a, b) => this.sortHabits(a, b));
      
    this.quitHabits = this.habits
      .filter(h => h.type === HabitType.QUIT)
      .sort((a, b) => this.sortHabits(a, b));
  }
  
  sortHabits(a: Habit, b: Habit): number {
    // Ordenar por completado (no completados primero)
    const aCompleted = this.habitService.isHabitCompleted(a);
    const bCompleted = this.habitService.isHabitCompleted(b);
    
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    
    // Si ambos tienen el mismo estado de completado, ordenar por nombre
    return a.name.localeCompare(b.name);
  }
  
  updateCompletedCounts(): void {
    this.completedDailyCount = this.dailyHabits.filter(h => 
      this.habitService.isHabitCompleted(h)).length;
      
    this.completedWeeklyCount = this.weeklyHabits.filter(h => 
      this.habitService.isHabitCompleted(h)).length;
      
    // CORRECCIÓN: Actualizar contador de hábitos mensuales completados
    this.completedMonthlyCount = this.monthlyHabits.filter(h => 
      this.habitService.isHabitCompleted(h)).length;
  }
  
  openHabitFormSidenav(habit?: Habit): void {
    this.currentHabitForForm = habit || null;
    this.isSidenavOpen = true;
  }
  
  closeHabitFormSidenav(): void {
    this.isSidenavOpen = false;
    this.currentHabitForForm = null;
  }
  
  handleHabitFormSubmit(formData: CreateHabitDTO | UpdateHabitDTO): void {
    if ('id' in formData) {
      // Actualizar hábito existente
      this.habitService.updateHabit(formData);
    } else {
      // Crear nuevo hábito
      this.habitService.addHabit(formData);
    }
    
    this.loadHabits();
    this.closeHabitFormSidenav();
  }
  
  trackHabitProgress(habit: Habit): void {
    this.habitService.trackProgress(habit);
    this.loadHabits();
  }
  
  deleteHabit(habit: Habit): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Eliminar hábito',
        message: '¿Estás seguro de que quieres eliminar este hábito? Esta acción eliminará también todo su historial de progreso.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.habitService.deleteHabit(habit.id);
        this.loadHabits();
      }
    });
  }
}
