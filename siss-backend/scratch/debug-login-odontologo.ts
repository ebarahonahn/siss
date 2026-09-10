import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'odontologo@siss.hn';
  console.log(`[DEBUG] Buscando usuario: ${email}`);

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

  console.log(`[AUTH] Validando acceso para: ${usuario.correo} | Rol: ${rolNombre} | esClinicoConAgenda: ${esClinicoConAgenda}`);

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
    console.log(`  - horas: ${hours}, minutos: ${minutes}, diaSemana: ${diaSemana}`);
    console.log(`  - minsActual: ${minsActual}`);

    // 1. Validar Excepciones
    const excepcion = await prisma.excepcionAgenda.findFirst({
      where: {
        medicoId: usuario.id,
        establecimientoId: asignacionSeleccionada.establecimientoId,
        fechaInicio: { lte: ahoraHonduras },
        fechaFin: { gte: ahoraHonduras },
      },
    });

    console.log(`  - excepcion encontrada:`, excepcion);

    // 2. Validar Jornada Base
    const agenda = await prisma.agendaBase.findFirst({
      where: {
        medicoId: usuario.id,
        establecimientoId: asignacionSeleccionada.establecimientoId,
        diaSemana,
        activo: true,
      },
    });

    console.log(`  - agenda encontrada:`, agenda);

    if (!agenda) {
      console.log(`[AUTH] Bloqueado: No se encontró jornada base para el día ${diaSemana}`);
      return;
    }

    const [hI, mI] = agenda.horaInicio.split(':').map(Number);
    const [hF, mF] = agenda.horaFin.split(':').map(Number);
    const minsInicio = hI * 60 + mI;
    const minsFin = hF * 60 + mF;

    const paramMargen = await prisma.parametroSistema.findUnique({ where: { clave: 'MARGEN_LOGIN_MINUTOS' } });
    const margen = paramMargen ? parseInt(paramMargen.valor) : 30;

    console.log(`[AUTH] Horario: ${agenda.horaInicio}-${agenda.horaFin} | MinsActual: ${minsActual} | MinsRange: ${minsInicio-margen} a ${minsFin+margen}`);

    if (minsActual < (minsInicio - margen) || minsActual > (minsFin + margen)) {
      console.log(`[AUTH] Bloqueado por estar fuera de horario`);
    } else {
      console.log(`[AUTH] Acceso PERMITIDO por horario`);
    }
  } else {
    console.log(`[AUTH] No califica para validación de agenda`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
