import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, state, style, animate, transition } from '@angular/animations';

import { Habit, HabitType, HabitFrequency } from '../../core/models/habit.model';
import { HabitService } from '../../core/services/habit.service';
import { ProgressMatrixComponent } from '../progress-matrix/progress-matrix.component';

@Component({
  selector: 'app-habit-item',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    ProgressMatrixComponent
  ],
  templateUrl: './habit-item.component.html',
  styleUrls: ['./habit-item.component.css'],
  animations: [
    trigger('progressAnimation', [
      state('initial', style({ width: '{{ startWidth }}%' }), { params: { startWidth: 0 } }),
      state('final', style({ width: '{{ endWidth }}%' }), { params: { endWidth: 100 } }),
      transition('initial => final', animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('checkmarkAnimation', [
      state('hidden', style({ opacity: 0, transform: 'scale(0.5)' })),
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      transition('hidden => visible', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class HabitItemComponent implements OnInit {
  @Input() habit!: Habit;
  @Output() trackProgress = new EventEmitter<Habit>();
  @Output() editHabit = new EventEmitter<Habit>();
  @Output() deleteHabit = new EventEmitter<Habit>();
  
  // CORRECCIÓN: Añadir referencia al elemento de la barra de progreso para manipulación directa
  @ViewChild('progressBar', { static: false }) progressBarRef!: ElementRef;
  
  isCompleted = false;
  progressMatrix: number[] = [];
  animationState = 'initial';
  checkmarkState = 'hidden';
  progressPercentage = 0;
  
  // Exponer enums al template
  habitType = HabitType;
  habitFrequency = HabitFrequency;
  
  // CORRECCIÓN: Identificador único para este componente
  private uniqueId: string;
  
  constructor(
    private habitService: HabitService,
    private snackBar: MatSnackBar,
    private elementRef: ElementRef
  ) {
    // CORRECCIÓN: Generar un ID único para este componente
    this.uniqueId = 'habit-' + Math.random().toString(36).substring(2, 9);
  }
  
  ngOnInit(): void {
    this.updateCompletionStatus();
    this.loadProgressMatrix();
    this.updateProgressPercentage();
    
    // Inicializar estado de animación del checkmark
    this.checkmarkState = this.isCompleted ? 'visible' : 'hidden';
    
    // CORRECCIÓN: Inicializar la barra de progreso con el valor correcto (0% para hábitos nuevos)
    // No inicializar como 'final' para evitar que la barra aparezca llena en hábitos nuevos
    this.animationState = 'initial';
    
    // CORRECCIÓN: Asegurar que la barra de progreso comience vacía (0%) usando el ID único
    setTimeout(() => {
      this.updateProgressBarWidth(this.progressPercentage);
    }, 0);
  }
  
  // CORRECCIÓN: Método para actualizar el ancho de la barra de progreso específica de este componente
  private updateProgressBarWidth(percentage: number): void {
    const element = this.elementRef.nativeElement.querySelector('.progress-bar');
    if (element) {
      element.style.width = `${percentage}%`;
    }
  }
  
  updateCompletionStatus(): void {
    this.isCompleted = this.habitService.isHabitCompleted(this.habit);
  }
  
  updateProgressPercentage(): void {
    this.progressPercentage = this.getProgressPercentage();
  }
  
  loadProgressMatrix(): void {
    // Obtener progreso real de los últimos 35 días
    if (this.habit) {
      this.progressMatrix = this.habitService.getProgressCounts(this.habit.id);
    } else {
      this.progressMatrix = [];
    }
  }
  
  onTrackProgress(): void {
    if (!this.isCompleted) {
      const prevProgress = this.getProgressPercentage();
      
      this.trackProgress.emit(this.habit);
      
      // Actualizar estado después de emitir el evento
      setTimeout(() => {
        this.updateCompletionStatus();
        this.loadProgressMatrix();
        
        // CORRECCIÓN: Asegurar que la barra de progreso se actualice correctamente
        const newProgress = this.getProgressPercentage();
        this.updateProgressPercentage();
        this.animateProgressBar(prevProgress, newProgress);
        
        // Animar el checkmark si se completó
        if (this.isCompleted) {
          this.checkmarkState = 'visible';
        }
        
        // Mostrar snackbar de confirmación
        this.showCompletionSnackbar();
      }, 100);
    }
  }
  
  animateProgressBar(startWidth: number, endWidth: number): void {
    // CORRECCIÓN: Asegurar que la animación use los valores correctos
    this.animationState = 'initial';
    
    // Forzar un reflow para que la animación se reinicie correctamente
    setTimeout(() => {
      // Luego actualizar al estado final con el nuevo ancho
      this.animationState = 'final';
      
      // CORRECCIÓN: Aplicar directamente el estilo al elemento DOM específico de este componente
      // usando el elemento de referencia para evitar afectar a otras tarjetas
      const finalWidth = this.isCompleted ? 100 : endWidth;
      this.updateProgressBarWidth(finalWidth);
    }, 50);
  }
  
  showCompletionSnackbar(): void {
    let message = '';
    
    if (this.isCompleted) {
      message = `¡Hábito "${this.habit.name}" completado!`;
    } else {
      message = `Progreso registrado en "${this.habit.name}"`;
    }
    
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: this.isCompleted ? 'success-snackbar' : 'info-snackbar'
    });
  }
  
  onEditHabit(): void {
    this.editHabit.emit(this.habit);
  }
  
  onDeleteHabit(): void {
    this.deleteHabit.emit(this.habit);
  }
  
  getProgressText(): string {
    if (this.isCompleted) {
      return 'Conseguido hoy';
    }
    
    if (this.habit.frequency === HabitFrequency.DAILY) {
      return 'Pendiente hoy';
    } else if (this.habit.frequency === HabitFrequency.WEEKLY) {
      return 'Conseguido semana';
    } else if (this.habit.frequency === HabitFrequency.MONTHLY) {
      return 'Conseguido mes';
    }
    
    return '';
  }
  
  getProgressFraction(): string {
    if (!this.habit.hasTarget || !this.habit.targetCount) {
      return '';
    }
    
    const todayProgress = this.getTodayProgress();
    return `${todayProgress}/${this.habit.targetCount}`;
  }
  
  getProgressPercentage(): number {
    if (!this.habit.hasTarget || !this.habit.targetCount) {
      return this.isCompleted ? 100 : 0;
    }
    
    const todayProgress = this.getTodayProgress();
    
    // CORRECCIÓN: Asegurar que el valor devuelto sea 100% para hábitos completados
    if (this.isCompleted) {
      return 100;
    }
    
    // Asegurar que el valor devuelto sea un número entre 0 y 100
    const percentage = Math.min(100, (todayProgress / this.habit.targetCount) * 100);
    // Evitar NaN o valores negativos
    return isNaN(percentage) || percentage < 0 ? 0 : percentage;
  }
  
  getTodayProgress(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayProgress = this.habit.progress.find(p => 
      new Date(p.date).setHours(0, 0, 0, 0) === today.getTime()
    );
    
    return todayProgress ? todayProgress.completedCount : 0;
  }
  
  getStatusText(): string {
    if (this.habit.type === HabitType.QUIT) {
      return '';
    }
    
    if (this.isCompleted) {
      return 'Completado';
    }
    
    return '';
  }
  
  getQuitDaysCount(): number {
    if (this.habit.type !== HabitType.QUIT || !this.habit.startDate) {
      return 0;
    }
    
    const startDate = new Date(this.habit.startDate);
    const today = new Date();
    
    // Calcular diferencia en días
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  getQuitDaysLabel(): string {
    const days = this.getQuitDaysCount();
    
    if (days === 0) {
      return 'Hoy empiezas';
    } else if (days === 1) {
      return 'día';
    } else {
      return 'días';
    }
  }
  
  // CORRECCIÓN: Método para obtener el ID único de este componente
  getUniqueId(): string {
    return this.uniqueId;
  }
}
