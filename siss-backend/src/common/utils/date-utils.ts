/**
 * Utilidades para el manejo de fechas en el backend.
 */
export class DateUtils {
  /**
   * Genera un rango de fechas UTC que cubre un día completo en una zona horaria específica.
   * Por defecto asume UTC-6 (Honduras).
   */
  static getLocalDayRange(fechaISO: string) {
    const inicio = new Date(`${fechaISO}T00:00:00.000Z`);
    const fin = new Date(`${fechaISO}T23:59:59.999Z`);

    return { inicio, fin };
  }

  /**
   * Retorna la fecha actual en formato YYYY-MM-DD (Local)
   * Útil para valores por defecto en el servidor.
   */
  static getHoyLocalString(offsetHours: number = -6): string {
    const d = new Date();
    // Ajustamos la fecha al offset local antes de extraer el string
    const local = new Date(d.getTime() + offsetHours * 60 * 60 * 1000);
    return local.toISOString().split('T')[0];
  }

  /**
   * Retorna un objeto Date que representa la hora local pero marcado como UTC.
   * Esto cumple con la Regla de Oro de SISS para almacenamiento literal.
   */
  static getLiteralNow(offsetHours: number = -6): Date {
    const d = new Date();
    const local = new Date(d.getTime() + offsetHours * 60 * 60 * 1000);
    // Tomamos la cadena ISO ajustada y la forzamos a UTC literal
    return new Date(local.toISOString());
  }
}
