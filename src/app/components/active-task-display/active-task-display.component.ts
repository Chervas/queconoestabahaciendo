import { Component, OnInit, OnDestroy, Pipe, PipeTransform, Output, EventEmitter } from "@angular/core";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { Task, TaskPriority } from "../../core/models/task.model";
import { TaskService } from "../../core/services/task.service";
import { HistoryService } from "../../core/services/history.service";
import { HistoryEntryType } from "../../core/models/history-entry.model";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { CommonModule } from "@angular/common";
import { PlayActiveTaskDialogComponent, PlayActiveTaskDialogData } from "../play-active-task-dialog/play-active-task-dialog.component";
import { DeleteConfirmationDialogComponent, DeleteConfirmationDialogData } from "../delete-confirmation-dialog/delete-confirmation-dialog.component";
import confetti from 'canvas-confetti';
import { TimeAgoPipe } from "../../core/pipes/time-ago.pipe";
import { PriorityTranslatePipe } from "../../core/pipes/priority-translation.pipe";

@Pipe({
  name: "formatTime",
  standalone: true
})
export class FormatTimePipe implements PipeTransform {
  transform(value: number): string {
    if (value === null || value === undefined) {
      value = 0;
    }
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = Math.floor(value % 60);
    if (hours > 0) {
      return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }
    return `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(num: number): string {
    return num < 10 ? "0" + num : num.toString();
  }
}

@Component({
  selector: "app-active-task-display",
  templateUrl: "./active-task-display.component.html",
  styleUrls: ["./active-task-display.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatMenuModule,
    FormatTimePipe,
    TimeAgoPipe,
    PriorityTranslatePipe,
    PlayActiveTaskDialogComponent,
    DeleteConfirmationDialogComponent
  ]
})
export class ActiveTaskDisplayComponent implements OnInit, OnDestroy {
  activeTask: Task | null = null;
  private _componentElapsedTime = 0;
  descriptionExpanded = false;
  private timerInterval: any;
  private periodicSaveInterval: any;
  private taskSubscription: Subscription;
  private previousActiveTaskForTimer: Task | null = null;
  availablePriorities: TaskPriority[] = Object.values(TaskPriority);
  TaskPriority = TaskPriority;
  isTaskPaused = false; // New state for pause

  @Output() requestOpenAddTaskDialog = new EventEmitter<void>();
  @Output() requestOpenEditTaskDialog = new EventEmitter<Task>();

  constructor(
    private taskService: TaskService,
    private historyService: HistoryService,
    public dialog: MatDialog
  ) {
    this.taskSubscription = this.taskService.activeTask$.subscribe(newActiveTask => {
      if (this.previousActiveTaskForTimer && this.previousActiveTaskForTimer.id !== newActiveTask?.id) {
        this.stopTimerAndSaveTime(this.previousActiveTaskForTimer, this._componentElapsedTime);
      }
      this.activeTask = newActiveTask;
      this.isTaskPaused = newActiveTask?.isPaused || false; // Initialize pause state
      this.previousActiveTaskForTimer = newActiveTask;
      if (newActiveTask) {
        this._componentElapsedTime = newActiveTask.elapsedTime || 0;
        if (!this.isTaskPaused) {
            this.startTimer();
        } else {
            this.stopTimerInternal(); // Ensure timer is stopped if loaded as paused
        }
      } else {
        this.stopTimerInternal();
        this.stopPeriodicSave();
        this._componentElapsedTime = 0;
        this.isTaskPaused = false;
      }
      this.descriptionExpanded = false;
    });
  }

  getPriorityButtonStyles(priority: TaskPriority | undefined): any {
    if (!priority) return {};
    switch (priority) {
      case TaskPriority.URGENT:
        return { 'background-color': 'var(--app-light-priority-urgent-bg)', 'color': 'var(--app-light-priority-urgent-text)' };
      case TaskPriority.HIGH:
        return { 'background-color': 'var(--app-light-priority-high-bg)', 'color': 'var(--app-light-priority-high-text)' };
      case TaskPriority.NORMAL:
        return { 'background-color': 'var(--app-light-priority-normal-bg)', 'color': 'var(--app-light-priority-normal-text)' };
      case TaskPriority.LOW:
        return { 'background-color': 'var(--app-light-priority-low-bg)', 'color': 'var(--app-light-priority-low-text)' };
      default:
        return { 'background-color': 'var(--app-light-priority-normal-bg)', 'color': 'var(--app-light-priority-normal-text)' };
    }
  }

  get displayElapsedTime(): number {
    return this._componentElapsedTime;
  }

  get isPlaying(): boolean {
    return !!this.activeTask && !!this.timerInterval && !this.isTaskPaused;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.activeTask) {
      this.stopTimerAndSaveTime(this.activeTask, this._componentElapsedTime);
    }
    this.stopPeriodicSave();
    if (this.taskSubscription) {
      this.taskSubscription.unsubscribe();
    }
  }

  startTimer(): void {
    this.stopTimerInternal();
    this.stopPeriodicSave();
    if (this.activeTask && !this.isTaskPaused) {
      this.timerInterval = setInterval(() => {
        this._componentElapsedTime++;
      }, 1000);
      this.periodicSaveInterval = setInterval(() => {
        if (this.activeTask) {
          this.taskService.updateTaskElapsedTime(this.activeTask.id, this._componentElapsedTime);
        }
      }, 15000);
    }
  }

  private stopTimerInternal(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private stopPeriodicSave(): void {
    if (this.periodicSaveInterval) {
      clearInterval(this.periodicSaveInterval);
      this.periodicSaveInterval = null;
    }
  }

  private stopTimerAndSaveTime(taskToSaveTimeFor: Task, elapsedTimeValue: number): void {
    this.stopTimerInternal();
    this.stopPeriodicSave();
    if (taskToSaveTimeFor) {
      this.taskService.updateTaskElapsedTime(taskToSaveTimeFor.id, elapsedTimeValue);
    }
  }

  onPlayPause(): void {
    if (!this.activeTask) return;

    if (this.isTaskPaused) { // If task is paused, unpause it
      this.isTaskPaused = false;
      this.activeTask.isPaused = false;
      this.taskService.updateTask({ id: this.activeTask.id, isPaused: false });
      this.startTimer();
      this.taskService.notifyTaskResumed(this.activeTask.title); // Snackbar notification
      return;
    }

    // If task is playing, open the pause dialog
    const dialogData: PlayActiveTaskDialogData = {
      message: "¿Pausando? 😡😡 ¡Dale al ▶️ play a otra tarea pendiente más corta en su lugar o crea una nueva! <br><br><i>💡Si te enfocas siempre en terminar tu tarea activa o eliges acabar otra más corta, serás más productivo.</i><br><br>Además, las tareas pausadas puntúan menos...",
      pauseCurrentButtonText: "Quiero pausarla",
      chooseOtherButtonText: "Ok, elegiré otra",
      createNewButtonText: "Crear tarea nueva"
    };

    const dialogRef = this.dialog.open(PlayActiveTaskDialogComponent, {
      width: "90%",
      maxWidth: "450px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === "pause_current") {
        this.isTaskPaused = true;
        if(this.activeTask) {
            this.activeTask.isPaused = true;
            this.taskService.updateTask({ id: this.activeTask.id, isPaused: true });
            this.stopTimerAndSaveTime(this.activeTask, this._componentElapsedTime);
            this.taskService.notifyTaskPaused(this.activeTask.title); // Snackbar notification
        }
      } else if (result === "create_new") {
        this.openCreateTaskDialog();
      } else if (result === "choose_other") {
        // User will choose from list
      }
    });
  }

  openCreateTaskDialog(): void {
    this.requestOpenAddTaskDialog.emit();
  }

  openEditTaskDialog(): void {
    if (this.activeTask) {
      this.requestOpenEditTaskDialog.emit(this.activeTask);
    }
  }

  onDeleteTask(): void {
    if (!this.activeTask) return;
    const dialogData: DeleteConfirmationDialogData = {
      message: "Vas a borrar la tarea activa, esto la eliminará completamente. ¿Estás seguro?",
      confirmButtonText: "Eliminar Tarea",
      cancelButtonText: "Cancelar"
    };

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: "90%",
      maxWidth: "450px",
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.activeTask) {
        const taskToDelete = this.activeTask;
        const finalElapsedTime = this._componentElapsedTime;
        this.stopTimerInternal();
        this.stopPeriodicSave();
        this.historyService.addHistoryEntry({
          title: `Tarea eliminada: ${taskToDelete.title}`,
          description: `Has eliminado la tarea: ${taskToDelete.title}`,
          type: HistoryEntryType.TASK_DELETED,
          relatedId: taskToDelete.id,
          metadata: {
            taskTitle: taskToDelete.title,
            duration: finalElapsedTime
          }
        });
        this.taskService.deleteTask(taskToDelete.id);
      }
    });
  }

  onComplete(): void {
    if (!this.activeTask) return;
    const finalElapsedTime = this._componentElapsedTime;
    this.stopTimerInternal();
    this.stopPeriodicSave();
    this.taskService.updateTaskElapsedTime(this.activeTask.id, finalElapsedTime);
    this.historyService.addHistoryEntry({
      title: `Tarea completada: ${this.activeTask.title}`,
      description: `Has completado la tarea: ${this.activeTask.title}`,
      type: HistoryEntryType.TASK_COMPLETED,
      relatedId: this.activeTask.id,
      metadata: {
        taskTitle: this.activeTask.title,
        duration: finalElapsedTime
      }
    });
    this.taskService.completeActiveTask(finalElapsedTime, this.activeTask.title); // Pass title for snackbar
    this.triggerConfetti();
  }

  triggerConfetti(): void {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  }

  toggleDescription(): void {
    this.descriptionExpanded = !this.descriptionExpanded;
  }

  changePriority(priority: TaskPriority): void {
    if (this.activeTask) {
      const updatedTask = { ...this.activeTask, priority: priority };
      this.taskService.updateTask(updatedTask);
    }
  }
}
