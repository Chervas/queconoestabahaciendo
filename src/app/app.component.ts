import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { PhaseService, AppPhase } from './core/services/phase.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    MainLayoutComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'queconoestabahaciendo';
  
  constructor(
    private phaseService: PhaseService,
    private router: Router,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    // Subscribe to phase changes to handle navigation
    this.phaseService.phaseState$.subscribe(state => {
      if (state.currentPhase === AppPhase.WORK) {
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/mi-isla']);
      }
    });
  }

  // Método para mostrar el diálogo de aviso cuando se intenta acceder a la fase de recreo más de una vez al día
  showRecreationAccessDeniedDialog(): void {
    const dialogData: ConfirmationDialogData = {
      message: 'Ya has entrado en tu isla hoy. Podrás volver a visitarla mañana, tras completar una nueva jornada.',
      confirmButtonText: 'Entendido',
      cancelButtonText: '',
      showCancelButton: false
    };
    
    this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      data: dialogData
    });
  }
}
