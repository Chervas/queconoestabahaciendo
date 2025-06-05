import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { PhaseService, AppPhase } from '../../core/services/phase.service';
import { Router, RouterModule } from '@angular/router';

export interface NavigationItem {
  id: string;
  icon: string;
  label: string;
  route?: string;
}

@Component({
  selector: 'app-navigation-rail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatRippleModule,
    RouterModule
  ],
  templateUrl: './navigation-rail.component.html',
  styleUrls: ['./navigation-rail.component.css']
})
export class NavigationRailComponent implements OnInit {
  @Input() activeSection: string = 'tasks';
  @Input() currentSection: string = 'tasks'; // Añadido para compatibilidad
  @Input() currentPhase: AppPhase = AppPhase.WORK; // Añadido para compatibilidad
  
  @Output() sectionChange = new EventEmitter<string>();
  @Output() expandedChange = new EventEmitter<boolean>();
  
  isMobile: boolean = false;
  isExpanded: boolean = false;
  
  // Secciones para fase de trabajo
  workSections: NavigationItem[] = [
    { id: 'tasks', icon: 'task_alt', label: 'Tareas', route: '/' },
    { id: 'habits', icon: 'checklist', label: 'Hábitos', route: '/habits' },
    { id: 'history', icon: 'history', label: 'Historial', route: '/history' }
  ];
  
  // Secciones para fase de recreo
  recreationSections: NavigationItem[] = [
    { id: 'island', icon: 'landscape', label: 'Isla', route: '/my-island' },
    { id: 'habits', icon: 'checklist', label: 'Hábitos', route: '/habits' },
    { id: 'social', icon: 'people', label: 'Social', route: '/social' },
    { id: 'planning', icon: 'calendar_month', label: 'Planificación', route: '/planning' }
  ];
  
  constructor(
    private phaseService: PhaseService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.checkScreenSize();
    
    // Si se proporciona currentSection, usarlo para activeSection
    if (this.currentSection && this.currentSection !== this.activeSection) {
      this.activeSection = this.currentSection;
    }
    
    // Si no se proporciona currentPhase, obtenerlo del servicio
    if (!this.currentPhase) {
      this.currentPhase = this.phaseService.getCurrentPhase();
      
      // Suscribirse a cambios en la fase solo si no se proporciona externamente
      this.phaseService.phaseState$.subscribe(state => {
        this.currentPhase = state.currentPhase;
      });
    }
    
    // Determinar la sección activa basada en la ruta actual
    this.setActiveSectionFromRoute(this.router.url);
  }
  
  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    // En móvil, siempre colapsar el menú
    if (this.isMobile) {
      this.isExpanded = false;
    }
  }
  
  toggleExpand(): void {
    if (!this.isMobile) {
      this.isExpanded = !this.isExpanded;
      this.expandedChange.emit(this.isExpanded);
    }
  }
  
  selectSection(section: NavigationItem): void {
    this.activeSection = section.id;
    this.sectionChange.emit(section.id);
    
    // Navegar a la ruta correspondiente si está definida
    if (section.route) {
      this.router.navigate([section.route]);
    }
  }
  
  // Determinar qué secciones mostrar según la fase actual
  get sections(): NavigationItem[] {
    return this.currentPhase === AppPhase.WORK ? this.workSections : this.recreationSections;
  }
  
  // Determinar si una sección está activa
  isActive(section: NavigationItem): boolean {
    // Comprobar si la URL actual coincide con la ruta de la sección
    const currentUrl = this.router.url;
    
    // Asegurar que solo una sección esté activa a la vez
    // Si estamos en la ruta de hábitos, solo la sección de hábitos debe estar activa
    if (currentUrl.includes('/habits') && section.id === 'habits') {
      return true;
    }
    
    // Para otras rutas, verificar coincidencia exacta
    if (section.route && section.route !== '/' && currentUrl.includes(section.route)) {
      return true;
    }
    
    // Para la ruta raíz (tareas), asegurarse de que solo está activa cuando estamos en la raíz exacta
    if (section.route === '/' && (currentUrl === '/' || currentUrl === '')) {
      return true;
    }
    
    // Si no hay coincidencia por URL, usar el ID activo como fallback
    return this.activeSection === section.id && !currentUrl.includes('/habits');
  }
  
  // Establecer la sección activa basada en la ruta actual
  private setActiveSectionFromRoute(url: string): void {
    // Eliminar parámetros de consulta y fragmentos
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // Buscar en las secciones de la fase actual
    const sections = this.sections;
    const matchingSection = sections.find(section => 
      section.route && cleanUrl.startsWith(section.route)
    );
    
    if (matchingSection) {
      this.activeSection = matchingSection.id;
    } else {
      // Si no hay coincidencia, establecer una sección predeterminada según la fase
      this.activeSection = this.currentPhase === AppPhase.WORK ? 'tasks' : 'island';
    }
  }
}
