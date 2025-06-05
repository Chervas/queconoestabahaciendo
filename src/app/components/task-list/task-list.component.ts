import { Component, OnInit, OnDestroy, Output, EventEmitter } from "@angular/core";
// MatDialog and MatDialogModule are no longer needed here for editing
import { Subscription, combineLatest } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { Task, TaskPriority } from "../../core/models/task.model";
import { TaskService } from "../../core/services/task.service";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TaskItemComponent } from "../task-item/task-item.component"; 
// TaskFormComponent import might not be directly used here anymore if sidenav handles it
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { TimeAgoPipe } from "../../core/pipes/time-ago.pipe";

// Interface para el objeto de tarea procesado con la nueva propiedad
interface ProcessedTask extends Task {
  isMostRecentPreviouslyActive?: boolean;
}

@Component({
  selector: "app-task-list",
  templateUrl: "./task-list.component.html",
  styleUrls: ["./task-list.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    // MatDialogModule, // Removed as edit dialog is replaced by sidenav
    TaskItemComponent,
    // TaskFormComponent, // Potentially removed if not directly used
    MatButtonToggleModule,
    TimeAgoPipe
  ]
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasksToDisplay: ProcessedTask[] = []; 
  isLoading = true;
  currentSort: string = "priority";
  private combinedSubscription: Subscription;

  @Output() requestOpenAddTaskDialog = new EventEmitter<void>();
  @Output() requestOpenEditTaskSidenav = new EventEmitter<Task>(); // New event for sidenav

  constructor(
    private taskService: TaskService
    // public dialog: MatDialog // Removed MatDialog injection
  ) {
    this.combinedSubscription = combineLatest([
      this.taskService.tasks$.pipe(startWith([])),
      this.taskService.activeTask$.pipe(startWith(null))
    ]).pipe(
      map(([allTasks, activeTask]: [Task[], Task | null]) => {
        let pendingTasks: Task[];
        if (activeTask) {
          pendingTasks = allTasks.filter((task: Task) => task.id !== activeTask.id);
        } else {
          pendingTasks = [...allTasks];
        }

        let mostRecentPreviouslyActiveTask: Task | null = null;
        if (pendingTasks && pendingTasks.length > 0) {
          const previouslyActiveTasks = pendingTasks.filter(task => task.wasPreviouslyActive && task.lastDeactivatedAt);
          if (previouslyActiveTasks.length > 0) {
            mostRecentPreviouslyActiveTask = previouslyActiveTasks.reduce((latest, current) => {
              return (latest.lastDeactivatedAt! > current.lastDeactivatedAt!) ? latest : current;
            });
          }
        }
        
        return pendingTasks.map((task: Task): ProcessedTask => ({
          ...task,
          isActive: false, 
          isMostRecentPreviouslyActive: mostRecentPreviouslyActiveTask !== null && task.id === mostRecentPreviouslyActiveTask.id
        })); 
      })
    ).subscribe((processedTasks: ProcessedTask[]) => {
      this.tasksToDisplay = this.sortTasksArray(processedTasks, this.currentSort) as ProcessedTask[];
      this.isLoading = false;
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.combinedSubscription) {
      this.combinedSubscription.unsubscribe();
    }
  }

  onSortChange(event: MatButtonToggleChange): void {
    this.currentSort = event.value;
    if (this.currentSort === undefined) {
      this.currentSort = "priority";
    }
    this.tasksToDisplay = this.sortTasksArray(this.tasksToDisplay, this.currentSort) as ProcessedTask[];
  }

  private sortTasksArray(tasks: Task[], criteria: string): Task[] {
    if (!criteria) {
      return [...tasks];
    }
    const tasksToSort = [...tasks];
    return tasksToSort.sort((a, b) => {
      switch (criteria) {
        case "priority":
          const priorityOrder = { [TaskPriority.URGENT]: 1, [TaskPriority.HIGH]: 2, [TaskPriority.NORMAL]: 3, [TaskPriority.LOW]: 4 }; 
          return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
        case "creationDate": 
          return (b.createdAt || 0) - (a.createdAt || 0); 
        case "name": 
          return (a.title || "").localeCompare(b.title || "");
        case "activity":
          const aTime = a.lastActivatedAt || a.lastDeactivatedAt || 0; // Consider lastDeactivatedAt for sorting
          const bTime = b.lastActivatedAt || b.lastDeactivatedAt || 0;
          if (bTime === 0 && aTime === 0) return (b.createdAt || 0) - (a.createdAt || 0); // Fallback to creation date if no activity
          if (bTime === 0) return -1;
          if (aTime === 0) return 1;
          return bTime - aTime;
        default: 
          return 0;
      }
    });
  }

  // Modified to emit an event instead of opening a dialog
  editTask(task: Task): void {
    this.requestOpenEditTaskSidenav.emit(task);
  }

  openCreateTaskDialog(): void {
    this.requestOpenAddTaskDialog.emit();
  }

  deleteTask(taskId: string): void {
    this.taskService.deleteTask(taskId);
  }

  activateTask(taskId: string): void {
    this.taskService.setActiveTask(taskId);
  }

  trackById(index: number, task: ProcessedTask): string {
    return task.id;
  }
}

