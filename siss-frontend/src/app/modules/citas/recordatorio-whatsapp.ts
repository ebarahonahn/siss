/** SISS almacena la hora local de la cita como UTC literal. */
export function prepararRecordatorioWhatsapp(cita: {
  estado: string;
  fechaHora: string;
  paciente: { telefono?: string | null };
  establecimiento?: { nombre?: string };
}) {
  if (!['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado)) {
    throw new Error('Solo puede enviar recordatorios de citas programadas o confirmadas.');
  }
  const original = (cita.paciente.telefono || '').trim();
  if (!/^[+\d\s().-]+$/.test(original)) {
    throw new Error('Actualice el teléfono del paciente antes de enviar el recordatorio.');
  }
  let telefono = original.replace(/[^\d]/g, '');
  if (telefono.startsWith('00')) telefono = telefono.slice(2);
  else if (!original.startsWith('+') && telefono.length === 8) telefono = `504${telefono}`;
  if (!/^[1-9]\d{7,14}$/.test(telefono) || (telefono.startsWith('504') && telefono.length !== 11)) {
    throw new Error('Ingrese un teléfono válido con código de país; para Honduras puede usar 8 dígitos.');
  }
  const fecha = new Date(cita.fechaHora);
  const ahoraLiteral = Date.now() - 6 * 60 * 60 * 1000;
  if (!Number.isFinite(fecha.getTime()) || fecha.getTime() <= ahoraLiteral) {
    throw new Error('La cita debe tener una fecha futura para enviar un recordatorio.');
  }
  const dia = new Intl.DateTimeFormat('es-HN', { timeZone: 'UTC', dateStyle: 'long' }).format(fecha);
  const hora = new Intl.DateTimeFormat('es-HN', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(fecha);
  const mensaje = `Hola. Le recordamos su cita en ${cita.establecimiento?.nombre || 'nuestro centro'} el ${dia} a las ${hora}.\nPor favor responda:\n1. Confirmar asistencia\n2. Solicitar reprogramación\n3. Cancelar cita\nGracias.`;
  return { telefono: `+${telefono}`, mensaje, url: `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}` };
}
