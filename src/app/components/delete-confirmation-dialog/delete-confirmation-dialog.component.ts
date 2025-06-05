import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";

export interface DeleteConfirmationDialogData {
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

@Component({
  selector: "app-delete-confirmation-dialog",
  templateUrl: "./delete-confirmation-dialog.component.html",
  styleUrls: ["./delete-confirmation-dialog.component.css"],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class DeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

