import { Injectable, signal, WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export enum AppPhase {
  WORK = 'work',
  RECREATION = 'recreation'
}

interface PhaseState {
  currentPhase: AppPhase;
  lastRecreationAccess: number | null; // Timestamp of last recreation phase access
}

@Injectable({
  providedIn: 'root'
})
export class PhaseService {
  private readonly phaseStorageKey = 'queconoestabahaciendo_phase_state_v1';
  private phaseStateSignal: WritableSignal<PhaseState>;
  
  public readonly phaseState$: Observable<PhaseState>;

  constructor() {
    // Initialize with default state or load from localStorage
    this.phaseStateSignal = signal<PhaseState>(this.loadPhaseStateFromStorage());
    this.phaseState$ = toObservable(this.phaseStateSignal);
  }

  /**
   * Get the current application phase
   */
  public getCurrentPhase(): AppPhase {
    return this.phaseStateSignal().currentPhase;
  }

  /**
   * Check if the current phase is work phase
   */
  public isWorkPhase(): boolean {
    return this.phaseStateSignal().currentPhase === AppPhase.WORK;
  }

  /**
   * Check if the current phase is recreation phase
   */
  public isRecreationPhase(): boolean {
    return this.phaseStateSignal().currentPhase === AppPhase.RECREATION;
  }

  /**
   * Check if user has accessed recreation phase today
   */
  public hasAccessedRecreationToday(): boolean {
    const lastAccess = this.phaseStateSignal().lastRecreationAccess;
    if (!lastAccess) return false;
    
    const lastAccessDate = new Date(lastAccess);
    const today = new Date();
    
    return (
      lastAccessDate.getDate() === today.getDate() &&
      lastAccessDate.getMonth() === today.getMonth() &&
      lastAccessDate.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Transition to recreation phase
   */
  public transitionToRecreationPhase(): void {
    // Transition to recreation phase
    this.phaseStateSignal.update(state => ({
      ...state,
      currentPhase: AppPhase.RECREATION,
      lastRecreationAccess: Date.now()
    }));
    
    this.savePhaseStateToStorage();
  }

  /**
   * Transition back to work phase
   */
  public transitionToWorkPhase(): void {
    this.phaseStateSignal.update(state => ({
      ...state,
      currentPhase: AppPhase.WORK
    }));
    
    this.savePhaseStateToStorage();
  }

  /**
   * Load phase state from localStorage
   */
  private loadPhaseStateFromStorage(): PhaseState {
    const defaultState: PhaseState = {
      currentPhase: AppPhase.WORK,
      lastRecreationAccess: null
    };
    
    try {
      const storedState = localStorage.getItem(this.phaseStorageKey);
      if (storedState) {
        return JSON.parse(storedState) as PhaseState;
      }
    } catch (e) {
      console.error('[PhaseService] Error loading phase state from storage:', e);
    }
    
    return defaultState;
  }

  /**
   * Save current phase state to localStorage
   */
  private savePhaseStateToStorage(): void {
    try {
      const stateJson = JSON.stringify(this.phaseStateSignal());
      localStorage.setItem(this.phaseStorageKey, stateJson);
    } catch (e) {
      console.error('[PhaseService] Error saving phase state to storage:', e);
    }
  }
}
