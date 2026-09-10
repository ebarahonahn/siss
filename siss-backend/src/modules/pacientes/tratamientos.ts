export function periodoPrescrito(fecha: Date, duracion: string, hoy: string) {
  const match = /^(\d+)\s*(?:d[ií]as?)?$/i.exec(duracion.trim());
  if (!match) return null;
  const dias = Number(match[1]);
  if (!Number.isSafeInteger(dias) || dias < 1 || dias > 36500) return null;
  const inicio = fecha.toISOString().slice(0, 10);
  const hasta = new Date(`${inicio}T00:00:00Z`);
  hasta.setUTCDate(hasta.getUTCDate() + dias - 1);
  const fin = hasta.toISOString().slice(0, 10);
  return inicio <= hoy && fin >= hoy ? { inicio, fin } : null;
}
