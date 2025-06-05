export enum HistoryEntryType {
  TASK_CREATED = 'task_created',
  TASK_ACTIVATED = 'task_activated',
  TASK_COMPLETED = 'task_completed',
  TASK_DELETED = 'task_deleted',
  HABIT_CREATED = 'habit_created',
  HABIT_COMPLETED = 'habit_completed',
  HABIT_UPDATED = 'habit_updated',
  HABIT_DELETED = 'habit_deleted',
  PHASE_COMPLETED = 'phase_completed',
  SYSTEM = 'system'
}

export interface HistoryEntry {
  id: string; // Unique ID for the history log entry
  type: HistoryEntryType; // Tipo de entrada de historial (task, habit, etc.)
  title: string; // Título del evento
  description?: string; // Descripción detallada
  timestamp: number; // When the event occurred
  relatedId?: string; // ID del elemento relacionado (tarea, hábito, etc.)
  metadata?: any; // Datos adicionales específicos del tipo de entrada
}
