import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface EventData {
  type: string;
  payload?: any;
}

// Definición de tipos de eventos para el sistema
export enum EventType {
  HABIT_COMPLETED = 'HABIT_COMPLETED',
  HABIT_CREATED = 'HABIT_CREATED',
  HABIT_UPDATED = 'HABIT_UPDATED',
  HABIT_DELETED = 'HABIT_DELETED'
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<EventData>();

  // Método para emitir eventos
  emit(event: EventData): void {
    this.eventSubject.next(event);
  }

  // Método para suscribirse a eventos de un tipo específico
  on(eventType: string): Observable<any> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === eventType),
      map(event => event.payload)
    );
  }
}
