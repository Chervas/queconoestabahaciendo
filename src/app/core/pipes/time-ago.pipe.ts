import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: any, ...args: any[]): string {
    if (!value) return '';

    const now = new Date().getTime();
    const createdAt = new Date(value).getTime();
    const seconds = Math.floor((now - createdAt) / 1000);

    if (seconds < 29) { // Menos de 30 segundos
      return 'Hace un momento';
    }

    const intervals: { [key: string]: number } = {
      'año': 31536000,
      'mes': 2592000,
      'semana': 604800,
      'día': 86400,
      'hora': 3600,
      'minuto': 60,
      'segundo': 1
    };

    let counter;
    for (const i in intervals) {
      counter = Math.floor(seconds / intervals[i]);
      if (counter > 0) {
        if (counter === 1) {
          return `Hace ${counter} ${i}`; // ej. "Hace 1 día"
        } else {
          // Pluralización simple, se puede mejorar para casos como "mes" -> "meses"
          const plural = i === 'mes' ? 'meses' : i + 's';
          return `Hace ${counter} ${plural}`; // ej. "Hace 2 días"
        }
      }
    }
    return 'Hace un momento'; // Fallback por si acaso
  }
}

