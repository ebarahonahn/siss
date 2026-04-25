/**
 * Calcula la semana epidemiológica según el estándar de la OPS/OMS (MMWR)
 * La semana comienza en domingo y la semana 1 es la primera semana del año
 * que contiene al menos 4 días del nuevo año.
 * 
 * @param date Fecha a calcular
 * @returns Número de la semana epidemiológica (1-53)
 */
export function getSemanaEpidemiologica(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);

  // Determinar el domingo de la semana actual
  // En JS, Sunday = 0
  const day = d.getDay();
  const sunday = new Date(d.getTime());
  sunday.setDate(d.getDate() - day);

  // La semana 1 es la que contiene el 4 de enero (o la que tiene al menos 4 días en enero)
  // Según MMWR, la semana 1 es la primera semana que tiene al menos 4 días en el año.
  // Como la semana empieza en domingo, si el 1 de enero es Jueves, Viernes o Sábado, 
  // la semana 1 empieza el domingo anterior (que cae en el año anterior).
  // Si el 1 de enero es Domingo, Lunes, Martes o Miércoles, esa es la semana 1.
  
  const year = sunday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay(); // 0 = Sun, ..., 6 = Sat

  let week1Sunday: Date;
  if (jan1Day <= 3) {
    // Si Jan 1 es Dom, Lun, Mar, Mié, la semana 1 empieza ese domingo (o el anterior si no es Dom)
    week1Sunday = new Date(jan1.getTime());
    week1Sunday.setDate(jan1.getDate() - jan1Day);
  } else {
    // Si Jan 1 es Jue, Vie, Sáb, la semana 1 empieza el siguiente domingo
    week1Sunday = new Date(jan1.getTime());
    week1Sunday.setDate(jan1.getDate() + (7 - jan1Day));
  }

  // Si la fecha actual es anterior a la semana 1 del año actual, pertenece al año anterior
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

  // Verificar si pertenece a la semana 1 del próximo año
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

    if (sunday >= nextWeek1Sunday) {
      return 1;
    }
  }

  return week;
}
