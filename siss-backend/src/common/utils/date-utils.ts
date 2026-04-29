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

  /**
   * Calcula la semana epidemiológica según el estándar de la OPS/OMS (MMWR)
   */
  static getSemanaEpidemiologica(date: Date): number {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const sunday = new Date(d.getTime());
    sunday.setDate(d.getDate() - day);
    
    const year = sunday.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay();

    let week1Sunday: Date;
    if (jan1Day <= 3) {
      week1Sunday = new Date(jan1.getTime());
      week1Sunday.setDate(jan1.getDate() - jan1Day);
    } else {
      week1Sunday = new Date(jan1.getTime());
      week1Sunday.setDate(jan1.getDate() + (7 - jan1Day));
    }

    if (sunday < week1Sunday) {
      const prevYear = year - 1;
      const prevJan1 = new Date(prevYear, 0, 1);
      const prevJan1Day = prevJan1.getDay();
      let prevWeek1Sunday: Date;
      if (prevJan1Day <= 3) {
        prevWeek1Sunday = new Date(prevJan1.getTime());
        prevWeek1Sunday.setDate(prevJan1.getDate() - prevJan1Day);
      } else {
        prevWeek1Sunday = new Date(prevJan1.getTime());
        prevWeek1Sunday.setDate(prevJan1.getDate() + (7 - prevJan1Day));
      }
      const diff = sunday.getTime() - prevWeek1Sunday.getTime();
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    }

    const diff = sunday.getTime() - week1Sunday.getTime();
    const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;

    if (week >= 52) {
      const nextYear = year + 1;
      const nextJan1 = new Date(nextYear, 0, 1);
      const nextJan1Day = nextJan1.getDay();
      let nextWeek1Sunday: Date;
      if (nextJan1Day <= 3) {
        nextWeek1Sunday = new Date(nextJan1.getTime());
        nextWeek1Sunday.setDate(nextJan1.getDate() - nextJan1Day);
      } else {
        nextWeek1Sunday = new Date(nextJan1.getTime());
        nextWeek1Sunday.setDate(nextJan1.getDate() + (7 - nextJan1Day));
      }
      if (sunday >= nextWeek1Sunday) return 1;
    }

    return week;
  }
}
