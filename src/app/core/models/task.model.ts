export enum TaskPriority {
  URGENT = "urgente",
  HIGH = "alta",
  NORMAL = "media",
  LOW = "baja"
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  createdAt: number;
  isActive?: boolean;
  isPaused?: boolean; // Added for pause state
  elapsedTime?: number;
  lastActivatedAt?: number;
  wasPreviouslyActive?: boolean;
  lastDeactivatedAt?: number;
}

