import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PhaseService } from '../../core/services/phase.service';
import { NavigationRailComponent } from '../navigation-rail/navigation-rail.component';
import Phaser from 'phaser';
import { IslandScene } from '../../scenes/island.scene';

@Component({
  selector: 'app-my-island',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    NavigationRailComponent
  ],
  template: `
    <div class="my-island-container">
      <app-navigation-rail
        [activeSection]="'island'"
        (sectionChange)="onSectionChange($event)">
      </app-navigation-rail>

      <mat-toolbar color="primary" class="island-toolbar">
        <span>Mi Isla</span>
        <span class="toolbar-spacer"></span>
        <button mat-icon-button aria-label="Alternar modo oscuro" (click)="toggleDarkMode()">
          <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
      </mat-toolbar>

      <div class="island-content">
        <div class="island-map-container" #gameContainer></div>
        <button mat-raised-button color="primary" class="return-button" (click)="returnToWorkPhase()">
          <mat-icon>work</mat-icon>
          Terminar fase de recreo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .my-island-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--app-light-background, #FFFFFF);
      overflow: hidden;
      padding-left: 72px;
    }
    .dark-theme .my-island-container {
      background-color: var(--app-dark-background, #121212);
    }
    .island-toolbar {
      background-color: var(--app-light-primary, #7b965d);
      color: white;
      z-index: 10;
    }
    .dark-theme .island-toolbar {
      background-color: var(--app-dark-primary, #5a7144);
    }
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    .island-content {
      flex: 1;
      position: relative;
      overflow: hidden;
      background-color: #1e88e5;
    }
    .island-map-container {
      width: 100%;
      height: 100%;
    }
    .return-button {
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 5;
      background-color: var(--app-light-primary, #7b965d);
    }
    @media (max-width: 767px) {
      .my-island-container {
        padding-left: 0;
        padding-bottom: 56px;
      }
      .return-button {
        bottom: 70px;
        left: 10px;
        right: 10px;
        width: calc(100% - 20px);
      }
    }
  `]
})
export class MyIslandComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') gameContainer!: ElementRef<HTMLDivElement>;

  isDarkMode = false;
  private game?: Phaser.Game;

  constructor(private phaseService: PhaseService) {
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference) {
      this.isDarkMode = JSON.parse(storedPreference);
    }
    this.applyTheme();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initPhaser();
  }

  ngOnDestroy(): void {
    this.game?.destroy(true);
  }

  private initPhaser(): void {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: this.gameContainer.nativeElement.clientWidth,
      height: this.gameContainer.nativeElement.clientHeight,
      parent: this.gameContainer.nativeElement,
      scale: {
        mode: Phaser.Scale.RESIZE
      },
      scene: [IslandScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    });
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  returnToWorkPhase(): void {
    this.phaseService.transitionToWorkPhase();
  }

  onSectionChange(sectionId: string): void {
    console.log('Sección seleccionada:', sectionId);
  }
}
