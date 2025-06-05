import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MatrixDot {
  filled: boolean;
  opacity: number; // 0.33, 0.66, 1.0 para representar el progreso
  isToday: boolean;
  dayIndex: number; // Índice del día de la semana (0-6)
}

@Component({
  selector: 'app-progress-matrix',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-matrix.component.html',
  styleUrls: ['./progress-matrix.component.css']
})
export class ProgressMatrixComponent implements OnInit, OnChanges {
  @Input() progressData: boolean[] = [];
  @Input() currentProgress: number = 0;
  @Input() totalProgress: number = 0;
  @Input() habitFrequency: string = 'daily'; // 'daily', 'weekly', 'monthly'
  
  matrixRows: MatrixDot[][] = [];
  
  // Días de la semana (7 filas)
  daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  ngOnInit(): void {
    this.generateMatrix();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progressData'] || changes['currentProgress'] || changes['totalProgress'] || changes['habitFrequency']) {
      this.generateMatrix();
    }
  }
  
  generateMatrix(): void {
    // CORRECCIÓN V30: Siempre usar 35 columnas y 7 filas
    const columns = 35;
    const rows = 7;
    
    // Inicializar la matriz completamente vacía
    this.initializeEmptyMatrix(rows, columns);
    
    // Procesar el progreso solo si hay datos válidos
    if (this.hasValidProgressData()) {
      this.processProgressData(columns, rows);
    }
    
    // Marcar el punto del día actual explícitamente
    this.markTodayDot(columns);
  }
  
  // CORRECCIÓN V30: Método para verificar si hay datos de progreso válidos
  hasValidProgressData(): boolean {
    // Verificar que el array de progreso existe y tiene más de un elemento
    // Un solo elemento generalmente es el valor inicial y no debe considerarse
    return this.progressData && Array.isArray(this.progressData) && this.progressData.length > 1;
  }
  
  // CORRECCIÓN V30: Método separado para inicializar matriz vacía
  initializeEmptyMatrix(rows: number, columns: number): void {
    this.matrixRows = [];
    
    for (let row = 0; row < rows; row++) {
      const rowDots: MatrixDot[] = [];
      
      for (let col = 0; col < columns; col++) {
        // Todos los puntos inicialmente vacíos con opacidad mínima
        rowDots.push({
          filled: false,
          opacity: 0.1,
          isToday: false,
          dayIndex: row
        });
      }
      
      this.matrixRows.push(rowDots);
    }
  }
  
  // CORRECCIÓN V30: Método separado para procesar datos de progreso
  processProgressData(columns: number, rows: number): void {
    // CORRECCIÓN V30: Verificación adicional para evitar procesar datos inválidos
    if (!this.hasValidProgressData()) {
      return;
    }
    
    // Crear una copia del array de progreso para no modificar el original
    const progressCopy = [...this.progressData];
    
    // CORRECCIÓN V30: Eliminar el primer elemento para evitar puntos erróneos
    // Este primer elemento suele ser un valor inicial que no representa progreso real
    if (progressCopy.length > 0) {
      progressCopy.shift();
    }
    
    // Si después de eliminar el primer elemento no quedan datos, salir
    if (progressCopy.length === 0) {
      return;
    }
    
    // CORRECCIÓN V30: Asignar progreso de manera explícita y controlada
    // Empezar desde el final del array (datos más recientes)
    let dataIndex = progressCopy.length - 1;
    
    // Posición a evitar: última columna de la última fila (día actual)
    const avoidRow = rows - 1;
    const avoidCol = columns - 1;
    
    // CORRECCIÓN V30: Recorrer la matriz de manera más controlada
    // Empezar desde la penúltima columna (la última está reservada para el día actual)
    for (let col = columns - 2; col >= 0 && dataIndex >= 0; col--) {
      // Dentro de cada columna, de abajo hacia arriba
      for (let row = rows - 1; row >= 0 && dataIndex >= 0; row--) {
        // Solo asignar si hay un dato de progreso válido para esta posición
        if (dataIndex >= 0 && dataIndex < progressCopy.length) {
          // Si el valor es true, marcar como lleno con opacidad completa
          if (progressCopy[dataIndex] === true) {
            this.matrixRows[row][col].filled = true;
            this.matrixRows[row][col].opacity = 1.0;
          }
          
          // Avanzar al siguiente dato
          dataIndex--;
        }
      }
    }
  }
  
  // CORRECCIÓN V30: Método separado para marcar el punto del día actual
  markTodayDot(columns: number): void {
    // Obtener el día actual (0-6, donde 0 es domingo según JavaScript Date)
    const today = new Date().getDay();
    // Convertir a nuestro formato donde 0 es lunes, 6 es domingo
    const todayIndex = today === 0 ? 6 : today - 1;
    
    // Última columna
    const lastCol = columns - 1;
    
    // CORRECCIÓN V30: Asegurar que el punto del día actual se coloque en la fila correcta
    if (this.matrixRows[todayIndex] && this.matrixRows[todayIndex][lastCol]) {
      // Marcar como el día actual
      this.matrixRows[todayIndex][lastCol].isToday = true;
      
      // Si hay progreso actual, actualizar el punto del día actual
      if (this.currentProgress > 0) {
        let opacity = 0.33; // Valor por defecto
        
        if (this.totalProgress > 0) {
          const progressRatio = this.currentProgress / this.totalProgress;
          
          // Determinar opacidad basada en el progreso
          if (progressRatio >= 1.0) {
            opacity = 1.0; // Progreso completo
          } else if (progressRatio >= 0.75) {
            opacity = 0.75; // Progreso alto
          } else if (progressRatio >= 0.5) {
            opacity = 0.5; // Progreso medio
          } else if (progressRatio >= 0.25) {
            opacity = 0.25; // Progreso bajo
          } else {
            opacity = 0.1; // Progreso mínimo
          }
        } else {
          // Si no hay objetivo total, cualquier progreso es completo
          opacity = 1.0;
        }
        
        // Actualizar el punto del día actual
        this.matrixRows[todayIndex][lastCol].filled = true;
        this.matrixRows[todayIndex][lastCol].opacity = opacity;
      }
    }
  }
  
  // Método para obtener el estilo de opacidad para un punto
  getDotStyle(dot: MatrixDot): any {
    // CORRECCIÓN: Asegurar que los estilos se apliquen correctamente
    if (!dot.filled) {
      return { 
        opacity: 0.1,
        backgroundColor: '#636309'
      };
    }
    
    return { 
      opacity: dot.opacity,
      backgroundColor: '#636309'
    };
  }
}
