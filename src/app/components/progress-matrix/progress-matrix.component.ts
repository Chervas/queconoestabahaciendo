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
  // Fecha base opcional para alinear la matriz. Si se establece, la primera
  // columna representará la semana que comienza en esa fecha.
  @Input() baseDate: Date | null = null;
  
  matrixRows: MatrixDot[][] = [];
  
  // Días de la semana (7 filas)
  daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  private readonly dayMs = 24 * 60 * 60 * 1000;

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // Convertir para que lunes sea 0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getDayIndex(date: Date): number {
    const jsDay = date.getDay();
    return jsDay === 0 ? 6 : jsDay - 1; // Lunes = 0
  }
  
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
<<<<<<< HEAD
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
=======
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = this.baseDate ? new Date(this.baseDate) : today;
      const baseWeek = this.startOfWeek(base);

      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i;
        const date = new Date(today);
        date.setDate(today.getDate() - age);
        const weekDiff = this.baseDate
          ? Math.floor((this.startOfWeek(date).getTime() - baseWeek.getTime()) / (7 * this.dayMs))
          : Math.floor((baseWeek.getTime() - this.startOfWeek(date).getTime()) / (7 * this.dayMs));
        const col = this.baseDate ? weekDiff : columns - 1 - weekDiff;
        if (col >= 0 && col < columns) {
          countsPerWeek[col] += this.progressData[i];
        }
      }

      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i;
        const date = new Date(today);
        date.setDate(today.getDate() - age);
        const weekDiff = this.baseDate
          ? Math.floor((this.startOfWeek(date).getTime() - baseWeek.getTime()) / (7 * this.dayMs))
          : Math.floor((baseWeek.getTime() - this.startOfWeek(date).getTime()) / (7 * this.dayMs));
        const col = this.baseDate ? weekDiff : columns - 1 - weekDiff;
        const row = this.getDayIndex(date);
        if (col >= 0 && col < columns) {
          const count = countsPerWeek[col];
          if (this.progressData[i] > 0) {
            this.matrixRows[row][col].filled = true;
          }
          const opacity = this.totalProgress > 0 ? Math.min(1, count / this.totalProgress) : 1;
>>>>>>> codex/actualizar-lógica-de-matrices-de-hábitos
          this.matrixRows[row][col].opacity = opacity;
        }
      }
    } else if (this.habitFrequency === 'monthly') {
<<<<<<< HEAD
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
=======
      const countsPerMonth = new Array(columns).fill(0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = this.baseDate ? new Date(this.baseDate) : today;
      const baseMonth = new Date(base.getFullYear(), base.getMonth(), 1);
      baseMonth.setHours(0, 0, 0, 0);

      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i;
        const date = new Date(today);
        date.setDate(today.getDate() - age);
        const monthDiff = this.baseDate
          ? (date.getFullYear() - baseMonth.getFullYear()) * 12 + date.getMonth() - baseMonth.getMonth()
          : (baseMonth.getFullYear() - date.getFullYear()) * 12 + baseMonth.getMonth() - date.getMonth();
        const col = this.baseDate ? monthDiff : columns - 1 - monthDiff;
        if (col >= 0 && col < columns) {
          countsPerMonth[col] += this.progressData[i];
        }
      }

      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i;
        const date = new Date(today);
        date.setDate(today.getDate() - age);
        const monthDiff = this.baseDate
          ? (date.getFullYear() - baseMonth.getFullYear()) * 12 + date.getMonth() - baseMonth.getMonth()
          : (baseMonth.getFullYear() - date.getFullYear()) * 12 + baseMonth.getMonth() - date.getMonth();
        const col = this.baseDate ? monthDiff : columns - 1 - monthDiff;
        const row = this.getDayIndex(date);
        if (col >= 0 && col < columns) {
          const count = countsPerMonth[col];
          if (this.progressData[i] > 0) {
            this.matrixRows[row][col].filled = true;
          }
          const opacity = this.totalProgress > 0 ? Math.min(1, count / this.totalProgress) : 1;
>>>>>>> codex/actualizar-lógica-de-matrices-de-hábitos
          this.matrixRows[row][col].opacity = opacity;
        }
      }
    } else {
<<<<<<< HEAD
      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i; // 0 es hoy
        const col = columns - 1 - Math.floor(age / rows);
        const row = rows - 1 - (age % rows);

        if (col >= 0 && col < columns && row >= 0 && row < rows) {
=======
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = this.baseDate ? new Date(this.baseDate) : today;
      const baseWeek = this.startOfWeek(base);

      for (let i = 0; i < dataLength; i++) {
        const age = dataLength - 1 - i; // 0 es hoy
        const date = new Date(today);
        date.setDate(today.getDate() - age);
        const weekDiff = this.baseDate
          ? Math.floor((this.startOfWeek(date).getTime() - baseWeek.getTime()) / (7 * this.dayMs))
          : Math.floor((baseWeek.getTime() - this.startOfWeek(date).getTime()) / (7 * this.dayMs));
        const col = this.baseDate ? weekDiff : columns - 1 - weekDiff;
        const row = this.getDayIndex(date);

        if (col >= 0 && col < columns) {
>>>>>>> codex/actualizar-lógica-de-matrices-de-hábitos
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
    
    // Columna donde se encuentra la semana actual
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const base = this.baseDate ? new Date(this.baseDate) : todayDate;
    const baseWeek = this.startOfWeek(base);
    const todayWeekDiff = this.baseDate
      ? Math.floor((this.startOfWeek(todayDate).getTime() - baseWeek.getTime()) / (7 * this.dayMs))
      : 0;
    const lastCol = this.baseDate ? todayWeekDiff : columns - 1;
    
    // CORRECCIÓN V30: Asegurar que el punto del día actual se coloque en la fila correcta
<<<<<<< HEAD
    const rows = this.matrixRows.length;
    const targetRow = this.habitFrequency === 'weekly' || this.habitFrequency === 'monthly' ? rows - 1 : todayIndex;
=======
    const targetRow = todayIndex;
>>>>>>> codex/actualizar-lógica-de-matrices-de-hábitos

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
