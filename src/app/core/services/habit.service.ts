import { Injectable, signal, computed } from '@angular/core';
import { Habit, HabitFrequency, HabitType, CreateHabitDTO, UpdateHabitDTO, HabitProgress } from '../models/habit.model';
import { HistoryEntryType } from '../models/history-entry.model';
import { v4 as uuidv4 } from 'uuid';
import { EventBusService, EventType } from './event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private habits = signal<Habit[]>([]);

  constructor(private eventBus: EventBusService) {
    // Cargar hábitos desde localStorage al iniciar
    this.loadFromLocalStorage();
  }
  
  private loadFromLocalStorage(): void {
    try {
      const storedHabits = localStorage.getItem('habits');
      if (storedHabits) {
        this.habits.set(JSON.parse(storedHabits));
      }
    } catch (error) {
      console.error('Error al cargar hábitos desde localStorage:', error);
    }
  }
  
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('habits', JSON.stringify(this.habits()));
    } catch (error) {
      console.error('Error al guardar hábitos en localStorage:', error);
    }
  }

  getHabits(): Habit[] {
    return this.habits();
  }

  getHabitById(id: string): Habit | undefined {
    return this.habits().find(h => h.id === id);
  }

  addHabit(habitData: CreateHabitDTO): Habit {
    const newHabit: Habit = {
      id: uuidv4(),
      ...habitData,
      progress: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      position: this.habits().length
    };

    this.habits.update(habits => [...habits, newHabit]);
    
    // Guardar en localStorage después de actualizar
    this.saveToLocalStorage();
    
    // Usar el bus de eventos para notificar la creación del hábito
    this.eventBus.emit({
      type: EventType.HABIT_CREATED,
      payload: {
        habit: newHabit
      }
    });
    
    return newHabit;
  }

  updateHabit(habitData: UpdateHabitDTO): Habit | undefined {
    let updatedHabit: Habit | undefined;

    this.habits.update(habits => {
      return habits.map(h => {
        if (h.id === habitData.id) {
          updatedHabit = {
            ...h,
            ...habitData,
            updatedAt: new Date().toISOString()
          };
          return updatedHabit;
        }
        return h;
      });
    });

    // Guardar en localStorage después de actualizar
    this.saveToLocalStorage();

    if (updatedHabit) {
      // Usar el bus de eventos para notificar la actualización del hábito
      this.eventBus.emit({
        type: EventType.HABIT_UPDATED,
        payload: {
          habit: updatedHabit
        }
      });
    }

    return updatedHabit;
  }

  deleteHabit(id: string): boolean {
    const habitToDelete = this.getHabitById(id);
    if (!habitToDelete) return false;

    this.habits.update(habits => habits.filter(h => h.id !== id));
    
    // Guardar en localStorage después de eliminar
    this.saveToLocalStorage();
    
    // Usar el bus de eventos para notificar la eliminación del hábito
    this.eventBus.emit({
      type: EventType.HABIT_DELETED,
      payload: {
        habit: habitToDelete
      }
    });
    
    return true;
  }

  trackProgress(habit: Habit): boolean {
    if (!habit) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    let updatedHabit: Habit | undefined;

    this.habits.update(habits => {
      return habits.map(h => {
        if (h.id === habit.id) {
          // Buscar si ya hay progreso para hoy
          const todayProgressIndex = h.progress.findIndex(p => 
            new Date(p.date).setHours(0, 0, 0, 0) === today.getTime()
          );

          let newProgress: HabitProgress[];

          if (todayProgressIndex >= 0) {
            // Actualizar progreso existente
            newProgress = [...h.progress];
            const newCompletedCount = newProgress[todayProgressIndex].completedCount + 1;
            const isCompleted = h.hasTarget && h.targetCount ? newCompletedCount >= h.targetCount : newCompletedCount > 0;
            
            newProgress[todayProgressIndex] = {
              ...newProgress[todayProgressIndex],
              completedCount: newCompletedCount,
              isCompleted: isCompleted
            };
          } else {
            // Crear nuevo progreso para hoy
            const completedCount = 1;
            const isCompleted = h.hasTarget && h.targetCount ? completedCount >= h.targetCount : completedCount > 0;
            
            newProgress = [...h.progress, { 
              date: todayStr, 
              completedCount: completedCount,
              targetCount: h.targetCount,
              isCompleted: isCompleted
            }];
          }

          updatedHabit = {
            ...h,
            progress: newProgress,
            updatedAt: new Date().toISOString()
          };
          return updatedHabit;
        }
        return h;
      });
    });

    // Guardar en localStorage después de actualizar el progreso
    this.saveToLocalStorage();

    if (updatedHabit) {
      // Verificar si se ha completado el hábito
      const isCompleted = this.isHabitCompleted(updatedHabit);
      
      // Si el hábito está completado, emitir evento a través del bus
      if (isCompleted) {
        this.eventBus.emit({
          type: EventType.HABIT_COMPLETED,
          payload: {
            habit: updatedHabit
          }
        });
      }
      
      return true;
    }

    return false;
  }

  isHabitCompleted(habit: Habit): boolean {
    if (!habit) return false;

    // Para hábitos de tipo "dejar algo", siempre se consideran completados
    if (habit.type === HabitType.QUIT) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar progreso de hoy
    const todayProgress = habit.progress.find(p => 
      new Date(p.date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (!todayProgress) return false;

    // Si no tiene objetivo, se considera completado con cualquier progreso
    if (!habit.hasTarget || !habit.targetCount) return todayProgress.completedCount > 0;

    // Si tiene objetivo, verificar si se ha alcanzado
    return todayProgress.completedCount >= habit.targetCount;
  }

  getProgressMatrix(habitId: string): boolean[] {
    const habit = this.getHabitById(habitId);
    if (!habit) return [];

    // Generar matriz de progreso para los últimos 35 días
    const result: boolean[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Buscar si hay progreso para esta fecha
      const hasProgress = habit.progress.some(p => {
        const progressDate = new Date(p.date);
        progressDate.setHours(0, 0, 0, 0);
        return progressDate.getTime() === date.getTime();
      });

      result.push(hasProgress);
    }

    return result;
  }
}
