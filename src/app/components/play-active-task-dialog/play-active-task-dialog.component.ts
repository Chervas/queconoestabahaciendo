import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon"; // Import MatIconModule

export interface PlayActiveTaskDialogData {
  message: string;
  pauseCurrentButtonText: string; 
  chooseOtherButtonText: string;
  createNewButtonText: string;
}

@Component({
  selector: "app-play-active-task-dialog",
  template: `
    <div class="play-active-task-dialog-container">
      <h2 mat-dialog-title>Pausar Tarea</h2>
      <mat-dialog-content>
        <p [innerHTML]="data.message"></p> <!-- Use [innerHTML] for formatted text later -->
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="m3-dialog-actions">
        <button mat-flat-button class="m3-pause-dialog-button-pause" (click)="onPauseCurrent()">
          <mat-icon>pause</mat-icon>
          <span>{{ data.pauseCurrentButtonText }}</span>
        </button>
        <button mat-stroked-button (click)="onChooseOther()">{{ data.chooseOtherButtonText }}</button>
        <button mat-flat-button color="primary" (click)="onCreateNew()">{{ data.createNewButtonText }}</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .play-active-task-dialog-container {
      display: flex;
      flex-direction: column;
      padding: 16px;
    }
    mat-dialog-actions {
      justify-content: flex-end;
      gap: 8px; /* Add gap between buttons */
    }
    mat-dialog-actions button {
      margin-left: 0; /* Remove default margin if gap is used */
    }
    .m3-pause-dialog-button-pause {
      background-color: var(--app-light-priority-normal-bg, #F0EAD6) !important;
      color: var(--app-light-priority-normal-text, #1C1B1F) !important;
      border: none !important;
    }
    .m3-pause-dialog-button-pause mat-icon {
      margin-right: 8px;
    }
    /* Ensure other buttons in this dialog maintain their intended styles */
    mat-dialog-actions button[mat-stroked-button] {
      border-color: var(--app-light-outline, #CAC4D0);
      color: var(--app-light-primary-action-text, #4E4C40);
    }
    mat-dialog-actions button[mat-flat-button][color="primary"] {
      background-color: var(--app-light-add-button-bg, #7b965d) !important; /* Assuming primary action color */
      color: var(--app-light-add-button-text, #FFFFFF) !important;
    }
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, MatIconModule] // Add MatIconModule
})
export class PlayActiveTaskDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PlayActiveTaskDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public data: PlayActiveTaskDialogData
  ) {}

  onPauseCurrent(): void {
    this.dialogRef.close("pause_current");
  }

  onCreateNew(): void {
    this.dialogRef.close("create_new");
  }

  onChooseOther(): void {
    this.dialogRef.close("choose_other");
  }
}

