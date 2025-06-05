import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core"; // Added Input, Output, EventEmitter
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
// Removed MatDialogRef, MAT_DIALOG_DATA, MatDialogModule as it's no longer a dialog
import { Task, TaskPriority } from "../../core/models/task.model";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from '@angular/material/toolbar'; // For a potential header in the sidenav

interface PrioritySelect {
  value: TaskPriority;
  viewValue: string;
}

@Component({
  selector: "app-task-form",
  templateUrl: "./task-form.component.html",
  styleUrls: ["./task-form.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    // MatDialogModule, // Removed
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule // Added for sidenav header
  ]
})
export class TaskFormComponent implements OnInit {
  @Input() taskToEdit: Task | null = null;
  @Output() formSubmit = new EventEmitter<Task>();
  @Output() closeSidenav = new EventEmitter<void>();

  taskForm: FormGroup;
  showAdvancedOptions = false;
  priorities: PrioritySelect[] = [
    { value: TaskPriority.URGENT, viewValue: "Urgente" },
    { value: TaskPriority.HIGH, viewValue: "Alta" },
    { value: TaskPriority.NORMAL, viewValue: "Normal" },
    { value: TaskPriority.LOW, viewValue: "Baja" }
  ];

  constructor(
    private fb: FormBuilder
    // Removed MatDialogRef and MAT_DIALOG_DATA injection
  ) {
    this.taskForm = this.fb.group({
      title: ["", Validators.required],
      priority: [TaskPriority.NORMAL, Validators.required],
      description: [""]
    });
  }

  ngOnInit(): void {
    if (this.taskToEdit) {
      this.taskForm.patchValue({
        title: this.taskToEdit.title,
        priority: this.taskToEdit.priority,
        description: this.taskToEdit.description
      });
      if (this.taskToEdit.description) {
        this.showAdvancedOptions = true;
      }
    } else {
      // Reset form if no task is being edited (for new task)
      this.taskForm.reset({
        title: "",
        priority: TaskPriority.NORMAL,
        description: ""
      });
      this.showAdvancedOptions = false;
    }
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const taskResult: Partial<Task> = {
        title: formValue.title,
        priority: formValue.priority,
        description: formValue.description
      };
      if (this.taskToEdit && this.taskToEdit.id) {
        taskResult.id = this.taskToEdit.id;
      }
      this.formSubmit.emit(taskResult as Task);
    }
  }

  onCancel(): void {
    this.closeSidenav.emit();
  }

  getPriorityClass(priority: TaskPriority): string {
    return `priority-icon-${priority.toString().toLowerCase()}`;
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENT: return "error_outline";
      case TaskPriority.HIGH: return "warning_amber";
      case TaskPriority.NORMAL: return "info_outline";
      case TaskPriority.LOW: return "low_priority";
      default: return "label_important_outline";
    }
  }

  get formTitle(): string {
    return this.taskToEdit ? 'Editar Tarea' : 'Nueva Tarea';
  }
}

