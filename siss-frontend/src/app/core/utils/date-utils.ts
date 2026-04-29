/**
 * Utilidades para el manejo de fechas evitando desplazamientos por zona horaria.
 */
export class DateUtils {
  /**
   * Retorna la fecha local actual en formato YYYY-MM-DD
   */
  static getHoyString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Convierte un objeto Date a string YYYY-MM-DD (Preservando el día calendario / UTC)
   */
  static getFechaISO(date: Date | string | null | undefined): string {
    if (!date) return '';
    let d: Date;
    if (typeof date === 'string') {
      if (date.length === 10) {
        return date; // Ya está en formato YYYY-MM-DD
      }
      d = new Date(date);
    } else {
      d = date;
    }
    
    // Usamos métodos UTC para evitar que el desfase de zona horaria cambie el día calendario
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  /**
   * Retorna el desfase de zona horaria local en formato ±HH:mm (ej: -06:00 para Honduras)
   */
  static getOffsetString() {
    const offset = new Date().getTimezoneOffset();
    const absOffset = Math.abs(offset);
    const h = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const m = String(absOffset % 60).padStart(2, '0');
    return (offset <= 0 ? '+' : '-') + h + ':' + m;
  }

  /**
   * Convierte un valor a formato ISO (YYYY-MM-DDTHH:mm:ss±HH:mm) incluyendo el offset local.
   * Maneja tanto objetos Date como strings de input datetime-local.
   */
  static getDateTimeISO(val: any): string | null {
    if (!val) return null;
    let base = '';

    if (typeof val === 'string') {
      // Si es un string de datetime-local (YYYY-MM-DDTHH:mm)
      if (val.includes('T')) {
        const [fecha, hora] = val.split('T');
        const [y, m, d] = fecha.split('-');
        const [hh, mm] = hora.split(':');
        base = `${y}-${m}-${d}T${hh || '00'}:${mm || '00'}:00`;
      } else {
        // Si es solo fecha
        base = `${val}T00:00:00`;
      }
    } else if (val instanceof Date) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      base = `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}T${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}`;
    } else {
      return null;
    }

    return base + 'Z';
  }

  /**
   * Valida si un string YYYY-MM-DD o YYYY-MM-DDTHH:mm es una fecha real
   */
  static esFechaValida(val: string | null | undefined): boolean {
    if (!val) return false;
    const [datePart] = val.split('T');
    const parts = datePart.split('-');
    if (parts.length !== 3) return false;

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);

    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
  }
}
