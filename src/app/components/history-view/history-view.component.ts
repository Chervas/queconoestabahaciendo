import { Component, OnInit, effect, Signal } from "@angular/core";
import { Location, CommonModule, DatePipe } from "@angular/common";
import { HistoryEntry, HistoryEntryType } from "../../core/models/history-entry.model";
import { HistoryService } from "../../core/services/history.service";
import { FormatTimePipe } from "../active-task-display/active-task-display.component";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "app-history-view",
  templateUrl: "./history-view.component.html",
  styleUrls: ["./history-view.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    FormatTimePipe,
    DatePipe
  ]
})
export class HistoryViewComponent implements OnInit {
  historyEntriesSignal: Signal<HistoryEntry[]>;
  displayedHistoryEntries: HistoryEntry[] = [];
  isLoading = true;

  constructor(
    private historyService: HistoryService,
    private location: Location
  ) {
    this.historyEntriesSignal = this.historyService.getHistoryEntries();
    effect(() => {
      this.displayedHistoryEntries = [...this.historyEntriesSignal()].sort((a: HistoryEntry, b: HistoryEntry) => b.timestamp - a.timestamp);
      this.isLoading = false;
    });
  }

  ngOnInit(): void {
    // Data is loaded by the service and updated via the signal and effect
    if (this.historyEntriesSignal().length === 0) {
        // isLoading is set to false in the effect, so this might not be strictly necessary
        // but kept for clarity if initial load is a concern.
    }
  }

  goBack(): void {
    this.location.back();
  }

  clearAllHistory(): void {
    this.historyService.clearHistory();
    // The effect will automatically update displayedHistoryEntries to be empty
  }

  trackById(index: number, entry: HistoryEntry): string {
    return entry.id;
  }
  
  getIconForEntryType(type: HistoryEntryType): string {
    switch (type) {
      case HistoryEntryType.TASK_COMPLETED:
        return 'task_alt';
      case HistoryEntryType.HABIT_COMPLETED:
        return 'check_circle';
      case HistoryEntryType.HABIT_CREATED:
        return 'add_circle';
      case HistoryEntryType.HABIT_UPDATED:
        return 'edit';
      case HistoryEntryType.HABIT_DELETED:
        return 'delete';
      case HistoryEntryType.PHASE_COMPLETED:
        return 'emoji_events';
      default:
        return 'history';
    }
  }
  
  getTypeLabel(type: HistoryEntryType): string {
    switch (type) {
      case HistoryEntryType.TASK_COMPLETED:
        return 'Tarea completada';
      case HistoryEntryType.HABIT_COMPLETED:
        return 'Hábito completado';
      case HistoryEntryType.HABIT_CREATED:
        return 'Hábito creado';
      case HistoryEntryType.HABIT_UPDATED:
        return 'Hábito actualizado';
      case HistoryEntryType.HABIT_DELETED:
        return 'Hábito eliminado';
      case HistoryEntryType.PHASE_COMPLETED:
        return 'Fase completada';
      default:
        return 'Actividad';
    }
  }
}
