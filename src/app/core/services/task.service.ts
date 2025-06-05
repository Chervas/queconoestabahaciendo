import { Injectable, signal, effect, WritableSignal, untracked } from "@angular/core";
import { Task, TaskPriority } from "../models/task.model";
import { toObservable } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: "root"
})
export class TaskService {
  private tasksSignal: WritableSignal<Task[]> = signal<Task[]>([]);
  private activeTaskSignal: WritableSignal<Task | null> = signal<Task | null>(null);

  public readonly tasks$: Observable<Task[]> = toObservable(this.tasksSignal);
  public readonly activeTask$: Observable<Task | null> = toObservable(this.activeTaskSignal);

  private readonly localStorageKey = "queconoestabahaciendo_tasks_v7";
  private readonly activeTaskStorageKey = "queconoestabahaciendo_activeTask_v7";

  constructor(private _snackBar: MatSnackBar) {
    this.loadTasksFromLocalStorage();
    this.loadActiveTaskFromLocalStorage();

    effect(() => {
      const currentTasks = this.tasksSignal();
      const currentActiveTask = this.activeTaskSignal();
      this.saveTasksToLocalStorage(currentTasks);
      this.saveActiveTaskToLocalStorage(currentActiveTask);
    });
  }

  private showNotification(message: string): void {
    this._snackBar.open(message, "Cerrar", {
      duration: 3000,
      panelClass: ["app-notification-success"]
    });
  }

  public notifyTaskPaused(taskTitle: string): void {
    this.showNotification(`La tarea "${taskTitle}" se ha pausado.`);
  }

  public notifyTaskResumed(taskTitle: string): void {
    this.showNotification(`Se ha reanudado la tarea "${taskTitle}".`);
  }

  private saveTasksToLocalStorage(tasks: Task[]): void {
    try {
      const tasksJson = JSON.stringify(tasks);
      localStorage.setItem(this.localStorageKey, tasksJson);
    } catch (e) {
      console.error("[TaskService] saveTasksToLocalStorage: Error saving tasks:", e);
    }
  }

  private saveActiveTaskToLocalStorage(activeTask: Task | null): void {
    try {
      const activeTaskJson = JSON.stringify(activeTask);
      localStorage.setItem(this.activeTaskStorageKey, activeTaskJson);
    } catch (e) {
      console.error("[TaskService] saveActiveTaskToLocalStorage: Error saving active task:", e);
    }
  }

  private loadTasksFromLocalStorage(): void {
    const storedTasks = localStorage.getItem(this.localStorageKey);
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks) as Task[];
        this.tasksSignal.set(parsedTasks);
      } catch (e) {
        console.error("[TaskService] loadTasksFromLocalStorage: Error parsing tasks:", e);
        this.tasksSignal.set(this.getSampleTasks());
      }
    } else {
      this.tasksSignal.set(this.getSampleTasks());
    }
  }

  private getSampleTasks(): Task[] {
    return [
      {
        id: this.generateId(),
        title: "Tarea Urgente de Prueba con Descripción Larga",
        priority: TaskPriority.URGENT,
        description: "Esta es una tarea urgente de prueba para validar colores y el botón expandir. Necesita ser lo suficientemente larga como para que el botón de expandir aparezca y se pueda probar su funcionalidad y estilo correctamente. Por lo tanto, añado más texto para asegurar que se cumpla la condición de truncamiento.",
        createdAt: Date.now() - 1000 * 60 * 60 * 2, 
        isActive: false,
        elapsedTime: 0,
        lastActivatedAt: undefined,
        wasPreviouslyActive: false,
        lastDeactivatedAt: undefined
      },
      {
        id: this.generateId(),
        title: "Tarea Alta de Prueba (descripción corta)",
        priority: TaskPriority.HIGH,
        description: "Esta es una tarea de prioridad alta con descripción corta.",
        createdAt: Date.now() - 1000 * 60 * 30, 
        isActive: false,
        elapsedTime: 0,
        lastActivatedAt: undefined,
        wasPreviouslyActive: false,
        lastDeactivatedAt: undefined
      },
    ];
  }

  private loadActiveTaskFromLocalStorage(): void {
    const storedActiveTask = localStorage.getItem(this.activeTaskStorageKey);
    if (storedActiveTask) {
      try {
        const parsedActiveTask = JSON.parse(storedActiveTask) as Task | null;
        this.activeTaskSignal.set(parsedActiveTask);
      } catch (e) {
        console.error("[TaskService] loadActiveTaskFromLocalStorage: Error parsing active task:", e);
        this.activeTaskSignal.set(null);
      }
    } else {
      this.activeTaskSignal.set(null);
    }
  }

  public loadTasks(): void {
    this.loadTasksFromLocalStorage();
    this.loadActiveTaskFromLocalStorage();
  }

  private generateId(): string {
    return "_" + Math.random().toString(36).substring(2, 9);
  }

  addTask(taskData: { title: string, priority: TaskPriority, description?: string }): Task {
    const newTask: Task = {
      id: this.generateId(),
      title: taskData.title,
      priority: taskData.priority,
      description: taskData.description || "",
      createdAt: Date.now(),
      isActive: false,
      elapsedTime: 0,
      lastActivatedAt: undefined,
      wasPreviouslyActive: false,
      lastDeactivatedAt: undefined
    };
    this.tasksSignal.update(currentTasks => [...currentTasks, newTask]);
    this.showNotification(`Se ha creado la tarea "${newTask.title}"`);
    return newTask;
  }

  updateTask(updatedTaskData: Partial<Task> & { id: string }): void {
    let taskTitle = "";
    this.tasksSignal.update(currentTasks =>
      currentTasks.map(task => {
        if (task.id === updatedTaskData.id) {
          taskTitle = updatedTaskData.title || task.title;
          return { ...task, ...updatedTaskData };
        }
        return task;
      })
    );
    const currentActive = untracked(this.activeTaskSignal);
    if (currentActive && currentActive.id === updatedTaskData.id) {
      this.activeTaskSignal.set({ ...currentActive, ...updatedTaskData, isActive: true });
    }
    if (taskTitle && !updatedTaskData.isPaused && updatedTaskData.isPaused !== undefined) { // Avoid notification on pause/resume from here
        this.showNotification(`La tarea "${taskTitle}" se ha editado correctamente`);
    }
  }

  deleteTask(taskId: string, notify: boolean = true): void { // Added notify parameter
    let deletedTaskTitle = "";
    const currentActive = untracked(this.activeTaskSignal);
    if (currentActive && currentActive.id === taskId) {
      deletedTaskTitle = currentActive.title;
      this.activeTaskSignal.set(null);
    }
    this.tasksSignal.update(currentTasks => {
        const taskToDelete = currentTasks.find(task => task.id === taskId);
        if (taskToDelete && !deletedTaskTitle) deletedTaskTitle = taskToDelete.title;
        return currentTasks.filter(task => task.id !== taskId)
    });
    if (deletedTaskTitle && notify) { // Check notify flag
        this.showNotification(`Se ha eliminado la tarea "${deletedTaskTitle}"`);
    }
  }

  setActiveTask(taskId: string | null): void {
    const now = Date.now();
    const currentActive = untracked(this.activeTaskSignal);

    if (currentActive && currentActive.id === taskId) return;

    let newActiveTaskForSignal: Task | null = null;
    let newlyActiveTaskTitleForNotification: string | null = null;

    this.tasksSignal.update(tasks => tasks.map(task => {
      let modifiedTask = { ...task };
      if (currentActive && task.id === currentActive.id) {
        const timeSpent = currentActive.lastActivatedAt ? (now - currentActive.lastActivatedAt) / 1000 : 0;
        modifiedTask.elapsedTime = (currentActive.elapsedTime || 0) + timeSpent;
        modifiedTask.isActive = false;
        modifiedTask.lastActivatedAt = undefined;
        modifiedTask.wasPreviouslyActive = true;
        modifiedTask.lastDeactivatedAt = now; 
      }
      if (taskId && task.id === taskId) {
        newActiveTaskForSignal = {
          ...modifiedTask,
          isActive: true,
          lastActivatedAt: now,
          wasPreviouslyActive: false,
          lastDeactivatedAt: undefined 
        };
        newlyActiveTaskTitleForNotification = newActiveTaskForSignal.title;
        return newActiveTaskForSignal;
      }
      if (task.id !== taskId) {
        modifiedTask.isActive = false;
      }
      return modifiedTask;
    }));

    this.activeTaskSignal.set(newActiveTaskForSignal);
    if (newlyActiveTaskTitleForNotification) {
      this.showNotification(`Se ha empezado a trabajar en "${newlyActiveTaskTitleForNotification}"`);
    }
  }

  updateTaskElapsedTime(taskId: string, newElapsedTime: number): void {
    this.tasksSignal.update(tasks =>
      tasks.map(task =>
        task.id === taskId ? { ...task, elapsedTime: newElapsedTime } : task
      )
    );
    const currentActive = untracked(this.activeTaskSignal);
    if (currentActive && currentActive.id === taskId) {
      this.activeTaskSignal.set({ ...currentActive, elapsedTime: newElapsedTime });
    }
  }

  completeActiveTask(finalElapsedTime: number, taskTitle: string): void {
    const activeTaskToComplete = untracked(this.activeTaskSignal);
    if (activeTaskToComplete) {
      this.updateTaskElapsedTime(activeTaskToComplete.id, finalElapsedTime);
      this.showNotification(`¡Enhorabuena, has completado la tarea "${taskTitle}"!`);
      this.deleteTask(activeTaskToComplete.id, false); // Pass false to prevent duplicate notification
    }
  }

  deactivateTask(taskId: string, currentElapsedTime: number): void {
    const currentActive = untracked(this.activeTaskSignal);
    if (currentActive && currentActive.id === taskId) {
      this.tasksSignal.update(tasks =>
        tasks.map(t =>
          t.id === taskId
            ? { ...t, isActive: false, elapsedTime: currentElapsedTime, lastActivatedAt: undefined, wasPreviouslyActive: true, lastDeactivatedAt: Date.now() }
            : t
        )
      );
      this.activeTaskSignal.set(null);
    }
  }
}

