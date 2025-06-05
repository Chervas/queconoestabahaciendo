import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PhaseService } from '../../core/services/phase.service';
import { NavigationRailComponent } from '../navigation-rail/navigation-rail.component';

@Component({
  selector: 'app-my-island',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    NavigationRailComponent
  ],
  template: `
    <div class="my-island-container">
      <!-- Navigation Rail Component -->
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
        <div class="island-map-container" #mapContainer>
          <div class="island-map-viewport" #mapViewport>
            <!-- Implementación SVG del mapa -->
            <svg #mapSvg 
                 class="island-map-svg" 
                 viewBox="0 0 1000 1000" 
                 preserveAspectRatio="xMidYMid meet">
              <g #mapContent 
                 class="island-map-content" 
                 [attr.transform]="'translate(' + posX + ',' + posY + ') scale(' + scale + ')'">
                <!-- Imagen del mapa como fondo -->
                <image href="assets/images/island/mapa.png" 
                       x="0" 
                       y="0" 
                       width="1000" 
                       height="1000" 
                       preserveAspectRatio="xMidYMid meet" />
                
                <!-- Aquí se pueden agregar elementos interactivos SVG en el futuro -->
                <!-- Por ejemplo: <circle id="casa1" cx="300" cy="200" r="20" fill="red" /> -->
              </g>
            </svg>
          </div>
          
          <!-- Controles de zoom -->
          <div class="island-map-controls">
            <button mat-mini-fab color="primary" (click)="zoomIn()" aria-label="Acercar">
              <mat-icon>add</mat-icon>
            </button>
            <button mat-mini-fab color="primary" (click)="zoomOut()" aria-label="Alejar">
              <mat-icon>remove</mat-icon>
            </button>
            <button mat-mini-fab color="primary" (click)="resetView()" aria-label="Restablecer vista">
              <mat-icon>home</mat-icon>
            </button>
          </div>
        </div>
        
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
      padding-left: 72px; /* Espacio para el navigation rail */
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
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      background-color: #1e88e5; /* Color azul del mar */
    }
    
    .island-map-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      touch-action: none;
    }
    
    .island-map-viewport {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
      touch-action: none;
    }
    
    .island-map-svg {
      width: 100%;
      height: 100%;
      user-select: none;
      touch-action: none;
    }
    
    .island-map-content {
      transform-origin: center center;
      will-change: transform;
      touch-action: none;
    }
    
    .island-map-controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 5;
    }
    
    .return-button {
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 5;
      background-color: var(--app-light-primary, #7b965d);
    }
    
    /* Estilos para elementos interactivos futuros */
    .interactive-element {
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .interactive-element:hover {
      transform: scale(1.1);
    }
    
    @media (max-width: 767px) {
      .my-island-container {
        padding-left: 0;
        padding-bottom: 56px; /* Espacio para el navigation rail en móvil */
      }
      
      .island-map-controls {
        bottom: 80px;
        right: 10px;
      }
      
      .return-button {
        bottom: 70px; /* Ajustado para evitar superposición con el navigation rail */
        left: 10px;
        right: 10px;
        width: calc(100% - 20px);
      }
    }
  `]
})
export class MyIslandComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('mapViewport') mapViewport!: ElementRef;
  @ViewChild('mapContent') mapContent!: ElementRef;
  @ViewChild('mapSvg') mapSvg!: ElementRef;
  
  isDarkMode = false;
  
  // Variables para el manejo de zoom y pan
  scale = 1;
  posX = 0;
  posY = 0;
  private startPosX = 0;
  private startPosY = 0;
  private startClientX = 0;
  private startClientY = 0;
  private isPanning = false;
  
  // Variables para pinch-to-zoom
  private initialDistance = 0;
  private initialScale = 1;
  
  // Límites de zoom
  private minScale = 0.5;
  private maxScale = 3;
  
  constructor(private phaseService: PhaseService) {
    // Check dark mode preference
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference) {
      this.isDarkMode = JSON.parse(storedPreference);
    }
    this.applyTheme();
  }
  
  ngOnInit(): void {
    // Inicialización del componente
  }
  
  ngAfterViewInit(): void {
    this.setupMapInteractions();
    // Centrar la vista inicialmente
    setTimeout(() => this.resetView(), 100);
  }
  
  @HostListener('window:resize')
  onResize(): void {
    // Ajustar la vista cuando cambia el tamaño de la ventana
    this.resetView();
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
    // Manejar cambios de sección en el navigation rail
    console.log('Sección seleccionada:', sectionId);
  }
  
  // Métodos para zoom y pan
  zoomIn(): void {
    this.scale = Math.min(this.maxScale, this.scale + 0.2);
    this.updateTransform();
  }
  
  zoomOut(): void {
    this.scale = Math.max(this.minScale, this.scale - 0.2);
    this.updateTransform();
  }
  
  resetView(): void {
    // Restablecer la vista a valores iniciales
    this.scale = 1;
    this.posX = 0;
    this.posY = 0;
    this.updateTransform();
  }
  
  private setupMapInteractions(): void {
    const mapSvg = this.mapSvg.nativeElement;
    
    // Mouse events para desktop
    mapSvg.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    mapSvg.addEventListener('wheel', this.onWheel.bind(this));
    
    // Touch events para móvil
    mapSvg.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
  }
  
  private onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isPanning = true;
    this.startClientX = e.clientX;
    this.startClientY = e.clientY;
    this.startPosX = this.posX;
    this.startPosY = this.posY;
  }
  
  private onMouseMove(e: MouseEvent): void {
    if (!this.isPanning) return;
    
    const dx = (e.clientX - this.startClientX);
    const dy = (e.clientY - this.startClientY);
    
    this.posX = this.startPosX + dx;
    this.posY = this.startPosY + dy;
    
    this.updateTransform();
  }
  
  private onMouseUp(): void {
    this.isPanning = false;
  }
  
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    
    // Determinar el punto de origen del zoom (posición del cursor)
    const rect = this.mapSvg.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calcular el punto en coordenadas SVG
    const svgPoint = this.mapSvg.nativeElement.createSVGPoint();
    svgPoint.x = x;
    svgPoint.y = y;
    
    // Ajustar el factor de zoom
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));
    
    // Ajustar la posición para mantener el punto bajo el cursor
    if (newScale !== this.scale) {
      const factor = newScale / this.scale;
      const dx = x - this.posX;
      const dy = y - this.posY;
      
      this.posX = x - dx * factor;
      this.posY = y - dy * factor;
      this.scale = newScale;
    }
    
    this.updateTransform();
  }
  
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Inicio de pan con un dedo
      this.isPanning = true;
      this.startClientX = e.touches[0].clientX;
      this.startClientY = e.touches[0].clientY;
      this.startPosX = this.posX;
      this.startPosY = this.posY;
    } 
    else if (e.touches.length === 2) {
      // Inicio de pinch-to-zoom con dos dedos
      this.isPanning = false;
      
      // Calcular la distancia inicial entre los dos dedos
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.initialDistance = Math.sqrt(dx * dx + dy * dy);
      this.initialScale = this.scale;
      
      // Guardar el punto medio entre los dos dedos
      this.startClientX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      this.startClientY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  }
  
  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    
    if (e.touches.length === 1 && this.isPanning) {
      // Pan con un dedo
      const dx = (e.touches[0].clientX - this.startClientX);
      const dy = (e.touches[0].clientY - this.startClientY);
      
      this.posX = this.startPosX + dx;
      this.posY = this.startPosY + dy;
      
      this.updateTransform();
    } 
    else if (e.touches.length === 2) {
      // Pinch-to-zoom con dos dedos
      
      // Calcular la nueva distancia entre los dos dedos
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calcular el nuevo factor de escala
      const newScale = Math.max(this.minScale, Math.min(this.maxScale, 
        this.initialScale * (distance / this.initialDistance)));
      
      // Calcular el punto medio actual entre los dos dedos
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      // Calcular el desplazamiento del punto medio
      const panX = (midX - this.startClientX);
      const panY = (midY - this.startClientY);
      
      // Actualizar la posición y escala
      this.posX = this.startPosX + panX;
      this.posY = this.startPosY + panY;
      this.scale = newScale;
      
      this.updateTransform();
    }
  }
  
  private onTouchEnd(): void {
    this.isPanning = false;
  }
  
  private updateTransform(): void {
    // No es necesario actualizar el estilo directamente, Angular se encarga de actualizar el atributo transform
    // a través del binding en el template: [attr.transform]="'translate(' + posX + ',' + posY + ') scale(' + scale + ')'"
  }
}
