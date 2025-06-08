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
  @Input() progressData: number[] = [];
  @Input() currentProgress: number = 0;
  @Input() totalProgress: number = 0;
  @Input() habitFrequency: string = 'daily'; // 'daily', 'weekly', 'monthly'
  @Input() matrixColumns: number = 35;
  
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
    const columns = this.matrixColumns;
    const rows = 7;

    // Inicializar la matriz vacía
    this.initializeEmptyMatrix(rows, columns);

    if (this.hasValidProgressData()) {
      this.processProgressData(columns, rows);
    }

    // Marcar el punto del día actual
    this.markTodayDot(columns);
  }
  
  // CORRECCIÓN V30: Método para verificar si hay datos de progreso válidos
  hasValidProgressData(): boolean {
    return Array.isArray(this.progressData) && this.progressData.length > 0;
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
    if (!this.hasValidProgressData()) {
      return;
    }

    const dataLength = this.progressData.length;

    if (this.habitFrequency === 'weekly') {
      const countsPerWeek = new Array(columns).fill(0);
      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i;
        const week = Math.floor(age / 7);
        const col = columns - 1 - week;
        if (col >= 0) {
          countsPerWeek[col] += this.progressData[i];
        }
      }
      for (let col = 0; col < columns; col++) {
        const count = countsPerWeek[col];
        if (count > 0) {
          const row = rows - 1;
          const opacity = this.totalProgress > 0 ? Math.min(1, count / this.totalProgress) : 1;
          this.matrixRows[row][col].filled = true;
          this.matrixRows[row][col].opacity = opacity;
        }
      }
    } else if (this.habitFrequency === 'monthly') {
      const daysPerMonth = 30;
      const countsPerMonth = new Array(columns).fill(0);
      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i;
        const month = Math.floor(age / daysPerMonth);
        const col = columns - 1 - month;
        if (col >= 0) {
          countsPerMonth[col] += this.progressData[i];
        }
      }
      for (let col = 0; col < columns; col++) {
        const count = countsPerMonth[col];
        if (count > 0) {
          const row = rows - 1;
          const opacity = this.totalProgress > 0 ? Math.min(1, count / this.totalProgress) : 1;
          this.matrixRows[row][col].filled = true;
          this.matrixRows[row][col].opacity = opacity;
        }
      }
    } else {
      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i; // 0 es hoy
        const col = columns - 1 - Math.floor(age / rows);
        const row = rows - 1 - (age % rows);

        if (col >= 0 && col < columns && row >= 0 && row < rows) {
          if (this.progressData[i] > 0) {
            this.matrixRows[row][col].filled = true;
            this.matrixRows[row][col].opacity = this.habitFrequency === 'quit' ? 1.0 : 1.0;
          }
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
    const rows = this.matrixRows.length;
    const targetRow = this.habitFrequency === 'weekly' || this.habitFrequency === 'monthly' ? rows - 1 : todayIndex;

    if (this.matrixRows[targetRow] && this.matrixRows[targetRow][lastCol]) {
      this.matrixRows[targetRow][lastCol].isToday = true;
      
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
        this.matrixRows[targetRow][lastCol].filled = true;
        this.matrixRows[targetRow][lastCol].opacity = this.habitFrequency === 'quit' ? 1.0 : opacity;
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
