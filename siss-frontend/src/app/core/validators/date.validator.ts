import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class DateValidators {
  /**
   * Valida que el valor sea una fecha real (evita 31 de abril, etc)
   */
  static dateReal(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = control.value; // Puede ser YYYY-MM-DD o YYYY-MM-DDTHH:mm
      const [datePart] = value.split('T');
      const parts = datePart.split('-');
      
      if (parts.length !== 3) return { dateInvalid: true };
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day ||
        isNaN(date.getTime())
      ) {
        return { dateInvalid: true };
      }
      
      return null;
    };
  }

  /**
   * Valida que la fecha no sea futura
   */
  static notFuture(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const selected = new Date(control.value + 'T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permitir hasta el final de hoy
      
      if (selected > today) {
        return { dateFuture: true };
      }
      
      return null;
    };
  }
}
