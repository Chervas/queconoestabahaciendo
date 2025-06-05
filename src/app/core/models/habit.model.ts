export enum HabitType {
  COUNTER = 'counter',
  QUIT = 'quit'
}

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface HabitProgress {
  date: string; // ISO date string
  completedCount: number;
  targetCount?: number; // Opcional para compatibilidad con datos existentes
  isCompleted?: boolean; // Opcional para compatibilidad con datos existentes
}

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  frequency?: HabitFrequency; // Solo para tipo COUNTER
  targetCount?: number; // Número objetivo de veces a completar (opcional)
  hasTarget: boolean; // Si tiene un objetivo específico o solo es contador
  startDate?: string; // ISO date string, opcional para hábitos que no son de tipo QUIT
  progress: HabitProgress[]; // Historial de progreso
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isActive?: boolean; // Si el hábito está activo o archivado, opcional para compatibilidad
  position?: number; // Posición para ordenar, opcional para compatibilidad
  description?: string; // Descripción del hábito, opcional
}

// Matriz de progreso para visualización de 7 días
export interface ProgressMatrix {
  days: {
    date: string; // ISO date string
    progress: number; // 0-100 porcentaje de completitud
  }[];
}

// Modelo para crear un nuevo hábito
export interface CreateHabitDTO {
  name: string;
  type: HabitType;
  frequency?: HabitFrequency;
  targetCount?: number;
  hasTarget: boolean;
  startDate?: string; // ISO date string, opcional (por defecto fecha actual)
  description?: string; // Descripción del hábito, opcional
}

// Modelo para actualizar un hábito existente
export interface UpdateHabitDTO {
  id: string;
  name?: string;
  frequency?: HabitFrequency;
  targetCount?: number;
  hasTarget?: boolean;
  isActive?: boolean;
  position?: number; // Añadido para permitir actualizar la posición
  description?: string; // Descripción del hábito, opcional
}
