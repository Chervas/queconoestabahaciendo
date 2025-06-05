import { Pipe, PipeTransform } from '@angular/core';
import { TaskPriority } from '../models/task.model';

@Pipe({
  name: 'priorityTranslate',
  standalone: true
})
export class PriorityTranslatePipe implements PipeTransform {

  transform(value: TaskPriority | string | undefined): string {
    if (!value) {
      return '';
    }

    // Convertir a minúsculas para una comparación insensible a mayúsculas/minúsculas
    const lowerValue = String(value).toLowerCase();

    switch (lowerValue) {
      case TaskPriority.URGENT: // "urgente"
      case 'urgent': // Manejar el string en inglés también
        return 'Urgente';
      case TaskPriority.HIGH: // "alta"
      case 'high':
        return 'Alta';
      case TaskPriority.NORMAL: // "media"
      case 'normal':
      case 'medium': // Alias común para "Normal"
        return 'Media';
      case TaskPriority.LOW: // "baja"
      case 'low':
        return 'Baja';
      default:
        // Si no es ninguno de los anteriores, intentar capitalizar el valor original
        // Esto cubriría si el valor ya está en español pero no capitalizado, o un valor inesperado
        const stringValue = String(value); // Usar el valor original para capitalizar
        if (stringValue.length === 0) return '';
        return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
    }
  }
}

