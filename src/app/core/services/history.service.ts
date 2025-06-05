import { Injectable, signal, effect, computed } from '@angular/core';
import { HistoryEntry, HistoryEntryType } from '../models/history-entry.model';
import { EventBusService, EventType } from './event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private historyEntries = signal<HistoryEntry[]>([]);
  private readonly localStorageKey = 'queconoestabahaciendo_history';

  constructor(private eventBus: EventBusService) {
    this.loadHistoryFromLocalStorage();

    effect(() => {
      this.saveHistoryToLocalStorage();
    });
    
    // Suscribirse a eventos del bus en lugar de dependencias directas
    this.eventBus.on(EventType.HABIT_COMPLETED).subscribe(payload => {
      this.addHistoryEntry({
        title: `Hábito completado: ${payload.habit.name}`,
        description: `Has completado tu hábito "${payload.habit.name}"`,
        type: HistoryEntryType.HABIT_COMPLETED,
        relatedId: payload.habit.id
      });
    });
    
    this.eventBus.on(EventType.HABIT_CREATED).subscribe(payload => {
      this.addHistoryEntry({
        title: `Hábito creado: ${payload.habit.name}`,
        description: `Has creado un nuevo hábito: ${payload.habit.name}`,
        type: HistoryEntryType.HABIT_CREATED,
        relatedId: payload.habit.id,
        metadata: {
          habitName: payload.habit.name
        }
      });
    });
    
    this.eventBus.on(EventType.HABIT_UPDATED).subscribe(payload => {
      this.addHistoryEntry({
        title: `Hábito actualizado: ${payload.habit.name}`,
        description: `Has actualizado el hábito: ${payload.habit.name}`,
        type: HistoryEntryType.HABIT_UPDATED,
        relatedId: payload.habit.id,
        metadata: {
          habitName: payload.habit.name
        }
      });
    });
    
    this.eventBus.on(EventType.HABIT_DELETED).subscribe(payload => {
      this.addHistoryEntry({
        title: `Hábito eliminado: ${payload.habit.name}`,
        description: `Has eliminado el hábito: ${payload.habit.name}`,
        type: HistoryEntryType.HABIT_DELETED,
        relatedId: payload.habit.id,
        metadata: {
          habitName: payload.habit.name
        }
      });
    });
  }

  private loadHistoryFromLocalStorage(): void {
    const storedHistory = localStorage.getItem(this.localStorageKey);
    if (storedHistory) {
      this.historyEntries.set(JSON.parse(storedHistory));
    } else {
      this.historyEntries.set([]);
    }
  }

  private saveHistoryToLocalStorage(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.historyEntries()));
  }

  private generateId(): string {
    return 'hist_' + Math.random().toString(36).substring(2, 9);
  }

  // Método modificado para requerir type explícitamente
  addHistoryEntry(entryData: Partial<Omit<HistoryEntry, 'id' | 'timestamp' | 'type'>> & { title: string, type: HistoryEntryType }): void {
    const newEntry: HistoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      title: entryData.title,
      type: entryData.type,
      description: entryData.description,
      relatedId: entryData.relatedId,
      metadata: entryData.metadata
    };
    
    this.historyEntries.update(currentEntries => [newEntry, ...currentEntries]); // Add to the beginning
  }

  getHistoryEntries() {
    return this.historyEntries.asReadonly();
  }

  // Obtener solo entradas relacionadas con hábitos
  getHabitHistoryEntries() {
    return computed(() => {
      return this.historyEntries().filter(entry => 
        entry.type === HistoryEntryType.HABIT_COMPLETED ||
        entry.type === HistoryEntryType.HABIT_CREATED ||
        entry.type === HistoryEntryType.HABIT_UPDATED ||
        entry.type === HistoryEntryType.HABIT_DELETED
      );
    });
  }

  clearHistory(): void {
    this.historyEntries.set([]);
  }
}
