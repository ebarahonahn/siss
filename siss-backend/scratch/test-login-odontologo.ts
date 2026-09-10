import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'odontologo@siss.hn';
  console.log(`[DEBUG] Simulando login para: ${email}`);

  const usuario = await prisma.usuario.findFirst({
    where: { correo: email },
    include: {
      rol: true,
      asignaciones: {
        where: { activo: true },
        include: {
          establecimiento: true,
          rol: true,
        }
      }
    }
  });

  if (!usuario) {
    console.log('[DEBUG] Usuario no encontrado');
    return;
  }

  const asignacionSeleccionada = usuario.asignaciones[0];
  if (!asignacionSeleccionada) {
    console.log('[DEBUG] No tiene asignaciones activas');
    return;
  }

  const rolNombre = (asignacionSeleccionada?.rol?.nombre || usuario.rol?.nombre || '').toUpperCase();
  const esClinicoConAgenda = rolNombre.includes('MEDICO') || rolNombre === 'ODONTOLOGIA';

  if (esClinicoConAgenda && asignacionSeleccionada) {
    const ahora = new Date();
    
    // Calculamos el desfase de Honduras (UTC-6) de forma dinámica
    const offsetHondurasMinutos = 360; 
    const offsetServidorMinutos = ahora.getTimezoneOffset();
    const diffMins = offsetServidorMinutos - offsetHondurasMinutos;
    
    const ahoraHonduras = new Date(ahora.getTime() + (diffMins * 60 * 1000));
    
    const hours = ahoraHonduras.getHours();
    const minutes = ahoraHonduras.getMinutes();
    const diaSemana = ahoraHonduras.getDay(); // 0-6 (Domingo-Sábado)
    const minsActual = hours * 60 + minutes;

    console.log(`  - horaHonduras: ${ahoraHonduras.toISOString()}`);
    console.log(`  - minsActual: ${minsActual}`);

    // 1. Validar Excepciones (Usamos la fecha para el rango)
    const excepcion = await prisma.excepcionAgenda.findFirst({
      where: {
        medicoId: usuario.id,
        establecimientoId: asignacionSeleccionada.establecimientoId,
        fechaInicio: { lte: ahoraHonduras },
        fechaFin: { gte: ahoraHonduras },
      },
    });

    let agendaActiva: { horaInicio: string; horaFin: string } | null = null;

    if (excepcion) {
      if (excepcion.tipo === 'CAMBIO_HORARIO' && excepcion.horaInicio && excepcion.horaFin) {
        console.log(`[AUTH] Detectado Cambio de Horario Especial: ${excepcion.horaInicio} - ${excepcion.horaFin}`);
        agendaActiva = {
          horaInicio: excepcion.horaInicio,
          horaFin: excepcion.horaFin
        };
      } else {
        console.log(`[AUTH] Bloqueado por excepción de ausencia`);
        return;
      }
    }

    if (!agendaActiva) {
      const agenda = await prisma.agendaBase.findFirst({
        where: {
          medicoId: usuario.id,
          establecimientoId: asignacionSeleccionada.establecimientoId,
          diaSemana,
          activo: true,
        },
      });

      if (!agenda) {
        console.log(`[AUTH] No se encontró jornada base`);
        return;
      }
      agendaActiva = {
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin
      };
    }

    const [hI, mI] = agendaActiva.horaInicio.split(':').map(Number);
    const [hF, mF] = agendaActiva.horaFin.split(':').map(Number);
    const minsInicio = hI * 60 + mI;
    const minsFin = hF * 60 + mF;

    const paramMargen = await prisma.parametroSistema.findUnique({ where: { clave: 'MARGEN_LOGIN_MINUTOS' } });
    const margen = paramMargen ? parseInt(paramMargen.valor) : 30;

    console.log(`[AUTH] Horario Activo: ${agendaActiva.horaInicio}-${agendaActiva.horaFin} | MinsActual: ${minsActual} | MinsRange: ${minsInicio-margen} a ${minsFin+margen}`);

    if (minsActual < (minsInicio - margen) || minsActual > (minsFin + margen)) {
      console.log(`[AUTH] Bloqueado por estar fuera de horario`);
    } else {
      console.log(`[AUTH] Acceso PERMITIDO`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
