import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from "@angular/core";
import { Task, TaskPriority } from "../../core/models/task.model";
import { TaskService } from "../../core/services/task.service";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { TimeAgoPipe } from '../../core/pipes/time-ago.pipe';
import { PriorityTranslatePipe } from "../../core/pipes/priority-translation.pipe";

// Extender la interfaz Task para incluir la nueva propiedad opcional que vendrá del task-list
interface ProcessedTaskItem extends Task {
  isMostRecentPreviouslyActive?: boolean;
}

@Component({
  selector: "app-task-item",
  templateUrl: "./task-item.component.html",
  styleUrls: ["./task-item.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    TimeAgoPipe,
    PriorityTranslatePipe
  ]
})
export class TaskItemComponent implements OnInit, OnDestroy {
  @Input() task!: ProcessedTaskItem;
  @Output() edit = new EventEmitter<Task>();

  private timer: any;
  private activeTaskSubscription!: Subscription;
  isActive = false;
  isDescriptionExpanded = false;
  private readonly DESCRIPTION_TRUNCATE_LENGTH = 60;

  availablePriorities: TaskPriority[] = [
    TaskPriority.URGENT,
    TaskPriority.HIGH,
    TaskPriority.NORMAL,
    TaskPriority.LOW
  ];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.activeTaskSubscription = this.taskService.activeTask$.subscribe(activeTask => {
      this.isActive = activeTask?.id === this.task.id;
    });
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.activeTaskSubscription) {
      this.activeTaskSubscription.unsubscribe();
    }
  }

  get hasDescription(): boolean {
    return !!(this.task.description && this.task.description.trim().length > 0);
  }

  get trimmedDescription(): string {
    return this.task.description ? this.task.description.trim() : '';
  }

  get displayDescription(): string {
    if (!this.hasDescription) {
      return '';
    }
    if (this.isDescriptionExpanded) {
      return this.trimmedDescription;
    }
    return this.trimmedDescription.slice(0, this.DESCRIPTION_TRUNCATE_LENGTH);
  }

  get showEllipsis(): boolean {
    return this.hasDescription && !this.isDescriptionExpanded && this.trimmedDescription.length > this.DESCRIPTION_TRUNCATE_LENGTH;
  }

  get showExpandButton(): boolean {
    return this.hasDescription;
  }

  // Lógica para los marcadores actualizada
  get showAnteriorTareaActivaSinTerminarMarker(): boolean {
    return !!this.task.wasPreviouslyActive && !!this.task.isMostRecentPreviouslyActive;
  }

  get showTareaSinTerminarMarker(): boolean {
    return !!this.task.wasPreviouslyActive && !this.task.isMostRecentPreviouslyActive;
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.taskService.deleteTask(this.task.id);
  }

  onToggleActivation(): void {
    this.taskService.setActiveTask(this.task.id);
  }

  onChangePriority(newPriority: TaskPriority): void {
    if (this.task) {
      this.taskService.updateTask({ ...this.task, priority: newPriority });
    }
  }

  toggleDescriptionExpansion(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENT: return "error_outline";
      case TaskPriority.HIGH: return "warning_amber";
      case TaskPriority.NORMAL: return "info_outline";
      case TaskPriority.LOW: return "low_priority";
      default: return "label_outlined";
    }
  }

  getPriorityButtonStyles(): any {
    switch (this.task.priority) {
      case TaskPriority.URGENT:
        return {
          'background-color': 'var(--app-light-priority-urgent-bg)',
          'color': 'var(--app-light-priority-urgent-text)'
        };
      case TaskPriority.HIGH:
        return {
          'background-color': 'var(--app-light-priority-high-bg)',
          'color': 'var(--app-light-priority-high-text)'
        };
      case TaskPriority.NORMAL:
        return {
          'background-color': 'var(--app-light-priority-normal-bg)',
          'color': 'var(--app-light-priority-normal-text)'
        };
      case TaskPriority.LOW:
        return {
          'background-color': 'var(--app-light-priority-low-bg)',
          'color': 'var(--app-light-priority-low-text)'
        };
      default:
        return {};
    }
  }

  getTaskCardClasses(): any {
    let classes: any = {};
    return classes;
  }
}

